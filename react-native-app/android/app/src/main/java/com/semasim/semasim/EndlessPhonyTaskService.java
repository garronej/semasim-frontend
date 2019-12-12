package com.semasim.semasim;

import android.content.Intent;
import android.os.Bundle;

import androidx.annotation.Nullable;

import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;

public class EndlessPhonyTaskService extends HeadlessJsTaskService {

    @Override
    protected @Nullable
    HeadlessJsTaskConfig getTaskConfig(Intent intent) {

        return new HeadlessJsTaskConfig(
                "EndlessPhonyTask",
                Arguments.createMap(),
                0,
                true
        );
    }

}
