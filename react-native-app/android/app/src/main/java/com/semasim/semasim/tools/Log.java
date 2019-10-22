package com.semasim.semasim.tools;


import android.os.Looper;

//import com.crashlytics.android.Crashlytics;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Log {

    private static String join(Object[] objects){

        StringBuilder builder = new StringBuilder();

        for (Object object : objects) {
            builder.append(object.toString());
        }

        return builder.toString();

    }

    private static Object[] addThreadAnnotation(Object[] objects){

        if( Looper.getMainLooper().getThread() == Thread.currentThread() ){

            return objects;

        }

        List<Object> where = new ArrayList<>(Arrays.asList(objects));

        where.add(" ( NOT UI THREAD )");

        return where.toArray(new Object[where.size()]);

    }


    public static void i(Object...objects) {

        objects= addThreadAnnotation(objects);

        String str= join(objects);

        android.util.Log.i("not-ReactNativeJS", str);

        //Crashlytics.log(str);

    }




}
