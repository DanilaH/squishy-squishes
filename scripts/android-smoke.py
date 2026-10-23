"""Native host smoke: real WebView, dock, Back, process death, rotation.
Requires a running emulator with the preview APK installed and websocket-client.
Does not claim that SDK inventory or AppMetrica dashboard delivery is verified.
"""
import json, os, pathlib, subprocess, time, urllib.request
import websocket
APP = 'com.danilah.squishysquishes.preview'
OUT = pathlib.Path('test-results/android-native'); OUT.mkdir(parents=True, exist_ok=True)
def adb(*args):
    return subprocess.check_output(['adb', *args], text=True).strip()
def connect():
    adb('shell', 'am', 'start', '-n', APP + '/.MainActivity')
    for _ in range(60):
        try:
            pid = adb('shell', 'pidof', APP).split()[0]
            adb('forward', 'tcp:9222', 'localabstract:webview_devtools_remote_' + pid)
            targets = json.load(urllib.request.urlopen('http://127.0.0.1:9222/json', timeout=2))
            target = next(t for t in targets if t.get('type') == 'page')
            return websocket.create_connection(target['webSocketDebuggerUrl'], suppress_origin=True, timeout=10)
        except Exception:
            time.sleep(1)
    raise RuntimeError('WebView debug target never appeared')
seq = 0
sock = None
def evaluate(expression):
    global seq
    seq += 1
    sock.send(json.dumps({'id':seq,'method':'Runtime.evaluate','params':{'expression':expression,'returnByValue':True,'awaitPromise':True}}))
    while True:
        result = json.loads(sock.recv())
        if result.get('id') == seq:
            if 'exceptionDetails' in result.get('result', {}): raise RuntimeError(result['result']['exceptionDetails'])
            return result.get('result',{}).get('result',{}).get('value')
def wait(expression):
    for _ in range(90):
        if evaluate(expression): return
        time.sleep(.5)
    raise AssertionError('Condition timed out: ' + expression)
def click(selector):
    assert evaluate(f'!!document.querySelector({json.dumps(selector)})'), selector
    evaluate(f'document.querySelector({json.dumps(selector)}).click()')
def screenshot(name):
    with (OUT / (name + '.png')).open('wb') as f:
        subprocess.run(['adb','exec-out','screencap','-p'],stdout=f,check=True)
try:
    adb('logcat','-c')
    sock = connect()
    wait('document.querySelector("[data-phaser-ready=true]") !== null')
    assert evaluate('navigator.locks !== undefined && typeof CompressionStream === "function"')
    if evaluate('!!document.querySelector("[data-guide-skip]")'): click('[data-guide-skip]')
    click('[data-shape="heart"]')
    adb('shell','input','keyevent','4')
    wait('!!document.querySelector("[data-exit-overlay]:not([hidden])")')
    adb('shell','input','keyevent','4')
    wait('!document.querySelector("[data-exit-overlay]:not([hidden])")')
    click('.craft-actions [data-action="save"]')
    wait('document.querySelector("[data-sandbox-app]")?.dataset.saveComplete === "true"')
    click('[data-action="home"]')
    wait('document.querySelector("[data-sandbox-library]")?.dataset.libraryCount === "1"')
    screenshot('portrait-room')
    portrait = evaluate('({width:innerWidth,height:innerHeight,screenHeight:screen.height,overflow:document.documentElement.scrollHeight>innerHeight})')
    assert not portrait['overflow'], portrait
    sock.close(); sock = None
    adb('shell','am','force-stop',APP)
    sock = connect()
    wait('document.querySelector("[data-sandbox-library]")?.dataset.libraryCount === "1"')
    adb('shell','settings','put','system','accelerometer_rotation','0')
    adb('shell','settings','put','system','user_rotation','1')
    wait('innerWidth > innerHeight')
    time.sleep(2)
    landscape = evaluate('({width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollHeight>innerHeight})')
    assert not landscape['overflow'], landscape
    screenshot('landscape-room')
    adb('shell','settings','put','system','user_rotation','0')
    wait('innerHeight > innerWidth')
    screenshot('portrait-return')
    (OUT/'acceptance.json').write_text(json.dumps({'portrait':portrait,'landscape':landscape,'processDeathSave':True,'backDraftConfirmation':True,'liveAdsVerified':False},indent=2))
finally:
    if sock: sock.close()
    (OUT/'logcat.txt').write_text(adb('logcat','-d','-t','1500'))
