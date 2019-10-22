package com.semasim.semasim.tools;

import org.jdeferred2.Deferred;
import org.jdeferred2.DoneCallback;
import org.jdeferred2.Promise;
import org.jdeferred2.android.AndroidDeferredObject;

import java.security.NoSuchAlgorithmException;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.KeySpec;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

public class PBKDF2WithHmacSHA1 {


    public static Promise<byte[], ?, ?>  run(String password, byte[] salt, int iterationCount){

        Deferred<byte[], ?, ?> d = new AndroidDeferredObject<>();

        ExecutorService executor = Executors.newSingleThreadExecutor();

        executor.execute(()-> {

            SecretKeyFactory secretKeyFactory;

            try {

                secretKeyFactory =SecretKeyFactory.getInstance("PBKDF2WithHmacSHA1");

            }catch(NoSuchAlgorithmException e){
                throw new RuntimeException(e.getMessage());

            }


            KeySpec keySpec = new PBEKeySpec(
                    password.toCharArray(),
                    salt,
                    iterationCount,
                    256
            );

            SecretKey secretKey;

            try {

                secretKey = secretKeyFactory.generateSecret(keySpec);

            }catch(InvalidKeySpecException e){

                throw new RuntimeException(e.getMessage());

            }

            executor.shutdown();

            d.resolve(secretKey.getEncoded());


        });

        return d.promise();

    }

    private static int[] iterationCounts= new int[] { 100000, 200000, 900000  };

    public static void test() {

        test(0);

    }

    private static void test(Integer i){

        byte[] salt = new byte[16];

        for( int j= 0; j < salt.length; j++){
            salt[j]= (byte)0xff;
        }

        String password= "abcde12345";

        int iterationCount= iterationCounts[i];

        Log.i("iteration count: " + iterationCount);

        run(password, salt, iterationCount).done((DoneCallback<byte[]>) result -> {

            Log.i("result: " + HexStringBinaryRepresentation.toStringHex(result));

            test(i+1);

        });


    }



}
