package com.danilah.squishysquishes.preview;

import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.yandex.mobile.ads.banner.BannerAdView;
import com.yandex.mobile.ads.banner.BannerAdSize;
import com.yandex.mobile.ads.banner.BannerAdEventListener;
import com.yandex.mobile.ads.common.*;
import com.yandex.mobile.ads.interstitial.*;
import com.yandex.mobile.ads.rewarded.*;
import io.appmetrica.analytics.AppMetrica;
import java.util.UUID;

@CapacitorPlugin(name = "SquishyServices")
public class SquishyServicesPlugin extends Plugin {
  private static final long INTERVAL = 150000L, FIRST_GRACE = 120000L, RETRY = 60000L;
  private final Handler handler = new Handler(Looper.getMainLooper());
  private SharedPreferences prefs;
  private boolean initialized, destroyed, resumed = true, loadingInterstitial, loadingRewarded;
  private long lastInterstitialRequest, lastRewardedRequest, lastBannerRequest;
  private InterstitialAdLoader interstitialLoader;
  private RewardedAdLoader rewardedLoader;
  private InterstitialAd interstitial;
  private RewardedAd rewarded;
  private BannerAdView banner;
  private FrameLayout bannerHost;
  private int bannerWidth;
  private android.widget.LinearLayout dock;
  private android.view.View.OnLayoutChangeListener dockListener;
  private boolean bannerWanted;
  private DurableStore store;
  private volatile JSObject unsavedReward;
  private PluginCall showing;
  private String showingKind, showingAttempt;
  private boolean shown, rewardIssued;
  private Runnable showDeadline;

  @Override public void load() {
    store = new DurableStore(getContext());
    prefs = getContext().getSharedPreferences("squishy-monetization", 0);
    if (!prefs.contains("first_open")) prefs.edit().putLong("first_open", System.currentTimeMillis()).apply();
    getActivity().runOnUiThread(() -> {
      installDock();
      YandexAds.initialize(getContext(), () -> getActivity().runOnUiThread(() -> {
        if (destroyed) return;
        initialized = true;
        interstitialLoader = new InterstitialAdLoader(getContext());
        rewardedLoader = new RewardedAdLoader(getContext());
        preloadAds();
        applyBanner();
      }));
    });
  }
  private boolean enabled() { return !getContext().getString(R.string.yandex_banner_id).isEmpty(); }
  private String unit(String kind) {
    boolean test = getContext().getResources().getBoolean(R.bool.ads_test_mode);
    if (test) return "demo-" + kind + "-yandex";
    return getContext().getString(kind.equals("banner") ? R.string.yandex_banner_id : kind.equals("rewarded") ? R.string.yandex_rewarded_id : R.string.yandex_interstitial_id);
  }
  private void event(String name, String kind) {
    if (!getContext().getString(R.string.appmetrica_api_key).isEmpty())
      AppMetrica.reportEvent(name, new JSObject().put("format", kind).put("test", getContext().getResources().getBoolean(R.bool.ads_test_mode)).toString());
  }
  private JSObject receipt() {
    try {
      String raw = store.get("native.reward");
      return raw == null ? null : new JSObject(raw);
    } catch (Exception error) { throw new IllegalStateException("Cannot read pending reward", error); }
  }
  @PluginMethod public void initialize(PluginCall call) {
    call.resolve(new JSObject().put("enabled", enabled()).put("test", getContext().getResources().getBoolean(R.bool.ads_test_mode)));
  }
  @PluginMethod public void pending(PluginCall call) {
    try { if (unsavedReward != null) { store.set("native.reward", unsavedReward.toString()); unsavedReward = null; } JSObject result = new JSObject(); JSObject r = receipt(); if (r != null) result.put("reward", r); call.resolve(result); }
    catch (Exception error) { call.reject("Cannot read pending reward", error); }
  }
  @PluginMethod public void acknowledge(PluginCall call) {
    try {
      synchronized (store) {
        JSObject r = receipt();
        if (r != null && call.getString("token", "").equals(r.getString("token"))) store.remove("native.reward");
      }
      call.resolve();
    } catch (Exception error) { call.reject("Cannot acknowledge reward", error); }
  }
  private String storageKey(PluginCall call) {
    String key = call.getString("key", "");
    if (!key.startsWith("squishy.") || key.length() > 240) throw new IllegalArgumentException("Invalid storage key");
    return key;
  }
  @PluginMethod public void storageGet(PluginCall call) {
    try { String value = store.get(storageKey(call)); call.resolve(new JSObject().put("value", value == null ? org.json.JSONObject.NULL : value)); }
    catch (Exception error) { call.reject("Storage read failed", error); }
  }
  @PluginMethod public void storageSet(PluginCall call) {
    try { String value = call.getString("value"); if (value == null) throw new IllegalArgumentException("Missing value"); store.set(storageKey(call), value); call.resolve(); }
    catch (Exception error) { call.reject("Storage write failed", error); }
  }
  @PluginMethod public void storageRemove(PluginCall call) {
    try { store.remove(storageKey(call)); call.resolve(); }
    catch (Exception error) { call.reject("Storage removal failed", error); }
  }
  @PluginMethod public void report(PluginCall call) {
    String name = call.getString("name", "");
    if (name.matches("[a-z][a-z0-9_]{0,63}")) {
      JSObject data = call.getObject("data", new JSObject());
      data.put("test", getContext().getResources().getBoolean(R.bool.ads_test_mode));
      if (!getContext().getString(R.string.appmetrica_api_key).isEmpty()) AppMetrica.reportEvent(name, data.toString());
    }
    call.resolve();
  }
  @PluginMethod public void preload(PluginCall call) { getActivity().runOnUiThread(this::preloadAds); call.resolve(); }
  private void preloadAds() {
    if (!initialized || destroyed || !enabled() || !resumed) return;
    long now = SystemClock.elapsedRealtime();
    if (interstitial == null && !loadingInterstitial && (lastInterstitialRequest == 0 || now - lastInterstitialRequest >= RETRY)) {
      loadingInterstitial = true; lastInterstitialRequest = now; event("ad_request", "interstitial");
      interstitialLoader.loadAd(new AdRequest.Builder(unit("interstitial")).build(), new InterstitialAdLoadListener() {
        @Override public void onAdLoaded(@NonNull InterstitialAd ad) {
          loadingInterstitial = false; if (!destroyed) { interstitial = ad; event("ad_loaded", "interstitial"); }
        }
        @Override public void onAdFailedToLoad(@NonNull AdRequestError error) { loadingInterstitial = false; event("ad_load_error", "interstitial"); }
      });
    }
    if (rewarded == null && !loadingRewarded && (lastRewardedRequest == 0 || now - lastRewardedRequest >= RETRY)) {
      loadingRewarded = true; lastRewardedRequest = now; event("ad_request", "rewarded");
      rewardedLoader.loadAd(new AdRequest.Builder(unit("rewarded")).build(), new RewardedAdLoadListener() {
        @Override public void onAdLoaded(@NonNull RewardedAd ad) {
          loadingRewarded = false; if (!destroyed) { rewarded = ad; event("ad_loaded", "rewarded"); }
        }
        @Override public void onAdFailedToLoad(@NonNull AdRequestError error) { loadingRewarded = false; event("ad_load_error", "rewarded"); }
      });
    }
  }
  @PluginMethod public void show(PluginCall call) { getActivity().runOnUiThread(() -> { try { showOnMain(call); } catch (Exception error) { call.reject("Ad request failed", error); } }); }
  private void showOnMain(PluginCall call) {
    String kind = call.getString("kind", "");
    if (!kind.equals("rewarded") && !kind.equals("interstitial")) { call.reject("Invalid format"); return; }
    if (destroyed || !resumed || showing != null || !initialized || !enabled()) { call.resolve(new JSObject().put("status", "unavailable")); return; }
    long now = System.currentTimeMillis();
    long since = now - prefs.getLong("last_fullscreen", 0L);
    long firstSession = now - prefs.getLong("first_open", now);
    if (kind.equals("interstitial") && (firstSession < FIRST_GRACE || since < INTERVAL || interstitial == null)) {
      call.resolve(new JSObject().put("status", "skipped")); preloadAds(); return;
    }
    if (kind.equals("rewarded") && (rewarded == null || (receipt() != null || unsavedReward != null) || call.getString("attempt", "").isEmpty())) {
      JSObject result = new JSObject().put("status", "unavailable"); if (receipt() != null) result.put("reward", receipt());
      call.resolve(result); preloadAds(); return;
    }
    showing = call; showingKind = kind; showingAttempt = call.getString("attempt", ""); shown = false; rewardIssued = false;
    if (bannerHost != null) bannerHost.setVisibility(View.GONE);
    // A missing pre-show callback must not leave the game blocked indefinitely.
    showDeadline = () -> { if (!shown && showing == call) finish("error"); };
    handler.postDelayed(showDeadline, 15000);
    try {
      if (kind.equals("interstitial")) {
        interstitial.setAdEventListener(new InterstitialAdEventListener() {
          @Override public void onAdShown() { if (showing == call) didShow(); }
          @Override public void onAdDismissed() { if (showing == call) finish("closed"); }
          @Override public void onAdFailedToShow(@NonNull AdError e) { if (showing == call) finish("error"); }
          @Override public void onAdClicked() { event("ad_clicked", "interstitial"); }
          @Override public void onAdImpression(@Nullable ImpressionData data) { event("ad_impression", "interstitial"); }
        });
        interstitial.show(getActivity());
      } else {
        rewarded.setAdEventListener(new RewardedAdEventListener() {
          @Override public void onAdShown() { if (showing == call) didShow(); }
          @Override public void onAdDismissed() { if (showing == call) finish("closed"); }
          @Override public void onAdFailedToShow(@NonNull AdError e) { if (showing == call) finish("error"); }
          @Override public void onAdClicked() { event("ad_clicked", "rewarded"); }
          @Override public void onAdImpression(@Nullable ImpressionData data) { event("ad_impression", "rewarded"); }
          @Override public void onRewarded(@NonNull Reward reward) {
            if (showing != call || rewardIssued || receipt() != null) return;
            String token = UUID.randomUUID().toString();
            try {
              unsavedReward = new JSObject().put("token", token).put("attempt", showingAttempt);
              store.set("native.reward", unsavedReward.toString());
              unsavedReward = null;
              rewardIssued = true;
              event("ad_reward_earned", "rewarded");
            } catch (Exception error) {
              event("ad_reward_persist_error", "rewarded");
              // Do not report an uncommitted reward to JavaScript as durable.
              rewardIssued = true;
              // Keep the fullscreen blocker until the SDK dismisses the ad.
            }
          }
        });
        rewarded.show(getActivity());
      }
    } catch (Exception e) { finish("error"); }
  }
  private void didShow() {
    if (showing == null) return;
    shown = true; handler.removeCallbacks(showDeadline);
    prefs.edit().putLong("last_fullscreen", System.currentTimeMillis()).apply();
    event("ad_shown", showingKind);
  }
  private void finish(String status) {
    if (showing == null) return;
    handler.removeCallbacks(showDeadline);
    if (unsavedReward != null) {
      try { store.set("native.reward", unsavedReward.toString()); unsavedReward = null; }
      catch (Exception error) { status = "reward-save-error"; }
    }
    JSObject result = new JSObject().put("shown", shown).put("status", status);
    if (showingKind.equals("rewarded") && receipt() != null) result.put("reward", receipt());
    event(status.equals("error") ? "ad_show_error" : "ad_closed", showingKind);
    if (shown) prefs.edit().putLong("last_fullscreen", System.currentTimeMillis()).apply();
    if (showingKind.equals("rewarded")) { if (rewarded != null) rewarded.setAdEventListener(null); rewarded = null; lastRewardedRequest = 0; }
    else { if (interstitial != null) interstitial.setAdEventListener(null); interstitial = null; lastInterstitialRequest = 0; }
    PluginCall call = showing; showing = null; showingAttempt = null; call.resolve(result);
    preloadAds(); applyBanner();
  }
  /** A sibling dock reduces the WebView itself. CSS vh/media queries therefore
   * describe the usable game area in portrait AND landscape; no overlay math. */
  private void installDock() {
    android.webkit.WebView web = getBridge().getWebView();
    ViewGroup parent = (ViewGroup) web.getParent();
    int index = parent.indexOfChild(web);
    ViewGroup.LayoutParams original = web.getLayoutParams();
    parent.removeView(web);
    android.widget.LinearLayout column = new android.widget.LinearLayout(getContext());
    column.setOrientation(android.widget.LinearLayout.VERTICAL);
    parent.addView(column, index, original);
    column.addView(web, new android.widget.LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
    dock = new android.widget.LinearLayout(getContext());
    dock.setGravity(android.view.Gravity.CENTER);
    dock.setBackgroundColor(android.graphics.Color.rgb(248, 234, 240));
    column.addView(dock, new android.widget.LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, (int)Math.ceil(60 * getContext().getResources().getDisplayMetrics().density)));
    dockListener = (view, l, t, r, b, ol, ot, or, ob) -> {
      if (r-l != or-ol) { clearBanner(); lastBannerRequest = 0; applyBanner(); }
    };
    dock.addOnLayoutChangeListener(dockListener);
  }
  private void clearBanner() {
    if (banner != null) { banner.setBannerAdEventListener(null); banner.destroy(); banner = null; }
    if (bannerHost != null) { dock.removeView(bannerHost); bannerHost = null; }
    bannerWidth = 0;
  }
  @PluginMethod public void banner(PluginCall call) { getActivity().runOnUiThread(() -> {
    bannerWanted = call.getBoolean("visible", false);
    applyBanner(); call.resolve();
  }); }
  private void applyBanner() {
    if (dock == null || destroyed) return;
    int width = dock.getWidth();
    if (width < 1) return;
    int dp = (int)Math.floor(width / getContext().getResources().getDisplayMetrics().density);
    BannerAdSize size = BannerAdSize.sticky(getContext(), Math.max(1, dp));
    int height = size.getHeightInPixels(getContext());
    if (dock.getLayoutParams().height != height) {
      ViewGroup.LayoutParams layout = dock.getLayoutParams(); layout.height = height; dock.setLayoutParams(layout);
    }
    if (!initialized || !enabled() || showing != null || !resumed || !bannerWanted) {
      if (bannerHost != null) bannerHost.setVisibility(View.INVISIBLE); return;
    }
    if (banner != null && bannerWidth != width) clearBanner();
    if (banner == null) {
      long now = SystemClock.elapsedRealtime();
      if (lastBannerRequest != 0 && now - lastBannerRequest < RETRY) return;
      bannerWidth = width; lastBannerRequest = now;
      bannerHost = new FrameLayout(getContext());
      dock.addView(bannerHost, new android.widget.LinearLayout.LayoutParams(width, height));
      banner = new BannerAdView(getActivity()); banner.setAdSize(size);
      bannerHost.addView(banner, new FrameLayout.LayoutParams(width, height, android.view.Gravity.CENTER));
      final BannerAdView current = banner;
      banner.setBannerAdEventListener(new BannerAdEventListener() {
        @Override public void onAdLoaded() { if (banner != current) return; event("ad_loaded", "banner"); applyBanner(); }
        @Override public void onAdFailedToLoad(@NonNull AdRequestError e) { if (banner != current) return; event("ad_load_error", "banner"); clearBanner(); }
        @Override public void onAdClicked() { if (banner == current) event("ad_clicked", "banner"); }
        @Override public void onImpression(@Nullable ImpressionData data) { if (banner == current) event("ad_impression", "banner"); }
      });
      event("ad_request", "banner"); banner.loadAd(new AdRequest.Builder(unit("banner")).build());
    }
    if (bannerHost != null) bannerHost.setVisibility(View.VISIBLE);
  }
  @Override protected void handleOnConfigurationChanged(Configuration config) {
    clearBanner(); lastBannerRequest = 0;
    if (dock != null) dock.post(this::applyBanner);
  }
  @Override protected void handleOnPause() { resumed = false; if (bannerHost != null) bannerHost.setVisibility(View.INVISIBLE); }
  @Override protected void handleOnResume() { resumed = true; preloadAds(); applyBanner(); }
  @Override protected void handleOnDestroy() {
    destroyed = true; handler.removeCallbacksAndMessages(null); clearBanner();
    if (dock != null && dockListener != null) dock.removeOnLayoutChangeListener(dockListener);
    if (interstitial != null) interstitial.setAdEventListener(null);
    if (rewarded != null) rewarded.setAdEventListener(null);
    if (showing != null) { showing.resolve(new JSObject().put("status", "interrupted")); showing = null; }
  }
}
