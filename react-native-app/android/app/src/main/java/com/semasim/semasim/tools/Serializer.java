package com.semasim.semasim.tools;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.semasim.semasim.tools.react_brige_serialization.MapUtil;

import org.json.JSONException;
import org.json.JSONObject;

import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.Map;

public class Serializer {

    @SuppressWarnings("unchecked")
    public static <T> T parseObjectJson( Class<T> interfaceOfObject,  String objectJson){

        final org.json.JSONObject objectJsonParsed;

        try{

            objectJsonParsed = new org.json.JSONObject(objectJson);

        }catch(JSONException e) {
            throw new RuntimeException(e.getMessage());
        }

        return (T) Proxy.newProxyInstance(
                interfaceOfObject.getClassLoader(),
                new Class[]{interfaceOfObject},
                (proxy, method, args) -> {

                    String propName= method.getName().substring(3);

                    propName= propName.substring(0,1).toLowerCase() + propName.substring(1);

                    if( !objectJsonParsed.has(propName)){
                        return null;
                    }

                    try {

                        return objectJsonParsed.getBoolean(propName);

                    }catch(JSONException e){ }

                    try {

                        return objectJsonParsed.getInt(propName);

                    }catch(JSONException e){ }

                    try {

                        return objectJsonParsed.getString(propName);

                    }catch(JSONException e){ }

                    throw new RuntimeException("JSON malformed");

                }
        );

    }

    public static <T> String stringifyObject(T object){

        Class objectClass = object.getClass();

        final org.json.JSONObject objectJsonParsed= new org.json.JSONObject();

        for( Method method: objectClass.getMethods()){

            if( method.getDeclaringClass() != objectClass ){
                continue;
            }

            Object value;

            try {

                value = method.invoke(object);

            }catch(Exception e){
                throw new RuntimeException(e.getMessage());
            }

            String propName;
            {

                String methodName = method.getName();

                propName= methodName.substring(3,4).toLowerCase() + methodName.substring(4);

            }

            try {

                objectJsonParsed.put(propName, value);

            }catch(JSONException e) {

                throw new RuntimeException(e.getMessage());

            }

            /*

            Class returnType = method.getReturnType();

            if( returnType == Boolean.class || returnType == boolean.class){

                Boolean bool;

                try {

                    bool= (Boolean)method.invoke(object);

                }catch(Exception e){
                    throw new RuntimeException(e.getMessage());
                }

                try {

                    objectJsonParsed.put("", bool);

                }catch(JSONException e){
                    throw new RuntimeException(e.getMessage());
                }

                continue;

            }

             */


        }

        return objectJsonParsed.toString();

    }

    /*
    public static <T> List<T> parseArrayJson(Class<T> interfaceOfObject, String arrayJson) {

        JSONArray arrayJsonParsed;

        try {
            arrayJsonParsed = new JSONArray(arrayJson);
        }catch(Exception e){
            throw new RuntimeException(e.getMessage());

        }

        int length = arrayJsonParsed.length();

        List<T> out = new ArrayList<>(length);

        for( int i = 0; i< length; i++){

            org.json.JSONObject objectJsonParsed;

            try {

                objectJsonParsed= arrayJsonParsed.getJSONObject(i);

            }catch(JSONException e){
                throw new RuntimeException(e.getMessage());
            }

            out.add(
                    parseObjectJson(
                            interfaceOfObject,
                            objectJsonParsed.toString()
                    )
            );


        }

        return out;


    }
     */

    public static String stringifyReactBridgeReadableMap(ReadableMap readableMap){

        JSONObject jsonObjectParsed;

        try {

            jsonObjectParsed= MapUtil.toJSONObject(readableMap);

        }catch (JSONException e){
            throw new RuntimeException(e.getMessage());
        }

        return jsonObjectParsed.toString();

    }

    public static WritableMap parseReactBrigeWritableMapFromJson(String jsonObject){

        JSONObject jsonObjectParsed;

        try {

            jsonObjectParsed= new JSONObject(jsonObject);

        }catch(Exception e){
            throw new RuntimeException(e.getMessage());
        }


        Map<String, Object> map;

        try {

            map = MapUtil.toMap(jsonObjectParsed);

        }catch(Exception e){
            throw new RuntimeException(e.getMessage());
        }

        return MapUtil.toWritableMap(map);


    }

}
