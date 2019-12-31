package com.semasim.semasim;

import android.content.Intent;

import androidx.annotation.Nullable;

import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;

public class HostKeepAliveTaskService extends HeadlessJsTaskService {

    @Override
    protected @Nullable
    HeadlessJsTaskConfig getTaskConfig(Intent intent) {

        return new HeadlessJsTaskConfig(
                "HostKeepAliveTask",
                Arguments.createMap(),
                0,
                true
        );

    }

}
