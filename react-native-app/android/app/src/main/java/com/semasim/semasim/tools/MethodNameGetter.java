package com.semasim.semasim.tools;

public class MethodNameGetter {

    public static String get(){
        return get(1);
    }

    public static String get(int depth){

        StackTraceElement[] stackTrace = Thread.currentThread()
                .getStackTrace();

        return stackTrace[3 + depth].getMethodName();

    }

}
