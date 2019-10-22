package com.semasim.semasim.tools;

public  class HexStringBinaryRepresentation {

    private static final char[] HEX_ARRAY = "0123456789abcdef".toCharArray();

    public static String toStringHex(byte[] data){

        char[] hexChars = new char[data.length * 2];
        for (int j = 0; j < data.length; j++) {
            int v = data[j] & 0xFF;
            hexChars[j * 2] = HEX_ARRAY[v >>> 4];
            hexChars[j * 2 + 1] = HEX_ARRAY[v & 0x0F];
        }
        return new String(hexChars);


    }

    public static byte[] fromStringHex(String dataHex) {

        int len = dataHex.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(dataHex.charAt(i), 16) << 4)
                    + Character.digit(dataHex.charAt(i+1), 16));
        }
        return data;

    }

}