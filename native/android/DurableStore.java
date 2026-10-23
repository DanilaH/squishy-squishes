package com.danilah.squishysquishes.preview;

import android.content.Context;
import android.util.AtomicFile;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/** Disk-authoritative per-key replacement. No SharedPreferences apply/cache
 * ambiguity; the collection's existing manifest is its multi-record commit point. */
final class DurableStore {
  private final File directory;
  DurableStore(Context context) {
    directory = new File(context.getFilesDir(), "squishy-store-v1");
    if (!directory.isDirectory() && !directory.mkdirs()) throw new IllegalStateException("Cannot create save directory");
  }
  private AtomicFile file(String key) throws Exception {
    byte[] digest = MessageDigest.getInstance("SHA-256").digest(key.getBytes(StandardCharsets.UTF_8));
    StringBuilder name = new StringBuilder();
    for (byte b : digest) name.append(String.format("%02x", b & 255));
    return new AtomicFile(new File(directory, name.toString()));
  }
  synchronized String get(String key) throws Exception {
    AtomicFile file = file(key);
    final String value;
    try { value = new String(file.readFully(), StandardCharsets.UTF_8); }
    catch (java.io.FileNotFoundException error) {
      // openRead performs AtomicFile backup recovery. Treat only genuinely absent
      // files as empty; an unreadable existing save must never become a new game.
      if (file.getBaseFile().exists() || new File(file.getBaseFile().getPath() + ".bak").exists()) throw error;
      return null;
    }
    return value.equals("null") ? null : new org.json.JSONArray("[" + value + "]").getString(0);
  }
  synchronized void set(String key, String value) throws Exception {
    write(key, org.json.JSONObject.quote(value));
    if (!value.equals(get(key))) throw new java.io.IOException("Save verification failed");
  }
  private void write(String key, String value) throws Exception {
    AtomicFile file = file(key);
    FileOutputStream output = null;
    try {
      output = file.startWrite();
      output.write(value.getBytes(StandardCharsets.UTF_8));
      output.getFD().sync();
      file.finishWrite(output);
    } catch (Exception error) { if (output != null) file.failWrite(output); throw error; }
  }
  synchronized void remove(String key) throws Exception {
    // Tombstone through the same atomic replacement path; a crash cannot expose
    // an older acknowledged receipt by interrupting deletion of backup files.
    write(key, "null");
    if (get(key) != null) throw new java.io.IOException("Removal verification failed");
  }
}
