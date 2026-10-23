package com.danilah.squishysquishes.preview;
import android.app.Application;
import io.appmetrica.analytics.AppMetrica;
import io.appmetrica.analytics.AppMetricaConfig;
public class SquishyApplication extends Application {
  @Override public void onCreate() {
    super.onCreate();
    String key = getString(R.string.appmetrica_api_key);
    if (!key.isEmpty()) {
      AppMetrica.activate(this, AppMetricaConfig.newConfigBuilder(key).withLocationTracking(false).build());
      AppMetrica.enableActivityAutoTracking(this);
    }
  }
}
