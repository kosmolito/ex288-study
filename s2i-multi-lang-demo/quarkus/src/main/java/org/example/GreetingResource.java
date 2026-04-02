package org.example;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;

@Path("/")
public class GreetingResource {

    @GET
    public String hello() {
        return "Hello from Quarkus S2I app!";
    }
}