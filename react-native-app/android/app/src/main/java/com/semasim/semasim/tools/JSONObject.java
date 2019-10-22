package com.semasim.semasim.tools;

public class JSONObject {

    private org.json.JSONObject o;

    public JSONObject() {
        o= new org.json.JSONObject();
    }

    public JSONObject(String jsonString){

        try{

            o= new org.json.JSONObject(jsonString);

        }catch(org.json.JSONException exception) {

            throw new RuntimeException(exception.getMessage());

        }

    }

    private JSONObject(org.json.JSONObject o){
        this.o= o;
    }

    public String getString(String name) {

        try {

            return o.getString(name);

        }catch(org.json.JSONException exception) {

            throw new RuntimeException(exception.getMessage());

        }

    }

    public JSONObject getJSONObject(String name)  {

        org.json.JSONObject o;

        try {

            o = this.o.getJSONObject(name);

        }catch(org.json.JSONException exception) {

            throw new RuntimeException(exception.getMessage());

        }

        return new JSONObject(o);


    }

    public long getLong(String name) {


        try {

            return o.getLong(name);

        }catch(org.json.JSONException exception) {

            throw new RuntimeException(exception.getMessage());

        }


    }

    public boolean isNull(String name) {
        return o.isNull(name);
    }

    public boolean getBoolean(String name) {

        try {

            return o.getBoolean(name);

        }catch(org.json.JSONException exception){

            throw new RuntimeException(exception.getMessage());

        }

    }

    public JSONObject put(String name, boolean value){

        try{

            o.put(name, value);

        }catch(org.json.JSONException exception){

            throw new RuntimeException(exception.getMessage());

        }

        return this;

    }

    public JSONObject put(String name, double value){

        try{

            o.put(name, value);

        }catch(org.json.JSONException exception){

            throw new RuntimeException(exception.getMessage());

        }

        return this;

    }

    public JSONObject put(String name, int value) {

        try{

            o.put(name, value);

        }catch(org.json.JSONException exception){

            throw new RuntimeException(exception.getMessage());

        }

        return this;

    }

    public JSONObject put(String name, long value){

        try{

            o.put(name, value);

        }catch(org.json.JSONException exception){

            throw new RuntimeException(exception.getMessage());

        }

        return this;

    }

    public JSONObject put(String name, Object value){

        if( value instanceof JSONObject ){

            value= ((JSONObject)value).o;

        }

        try{

            o.put(name, value);

        }catch(org.json.JSONException exception){

            throw new RuntimeException(exception.getMessage());

        }

        return this;

    }

    public JSONObject putOpt(String name, Object value){

        try{

            o.putOpt(name, value);

        }catch(org.json.JSONException exception){

            throw new RuntimeException(exception.getMessage());

        }

        return this;

    }

    public String toString() {

        return o.toString();


    }

    public boolean has(String name) {

        return o.has(name);

    }

    public int getInt(String name)  {

        try{

            return o.getInt(name);

        }catch(org.json.JSONException exception){

            throw new RuntimeException(exception.getMessage());

        }

    }

}
