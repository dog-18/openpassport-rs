use actix_web::{web, HttpResponse, Responder};
use deno::{initialize_verifier, verify_passport};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct InitializeVerifierParams {
    scope: String,
    attestation_id: Option<String>,
    requirements: Option<Vec<(String, String)>>,
    rpc_url: Option<String>,
    dev_mode: bool,
}

#[derive(Deserialize)]
pub struct VerifyPassportParams {
    dsc_proof: Vec<String>,
    dsc: String,
    circuit: String,
}

pub async fn index() -> impl Responder {
    HttpResponse::Ok().body(
        "Welcome to the API server!\n\nAvailable routes:\n\n\
    POST /initialize - Initialize the verifier with parameters\n\
    POST /verify - Verify the passport using provided data\n\
    ",
    )
}

pub async fn initialize(data: web::Json<InitializeVerifierParams>) -> impl Responder {
    match initialize_verifier(data.scope.clone(), None, None, None, data.dev_mode).await {
        Ok(_) => HttpResponse::Ok().body("Verifier initialized successfully"),
        Err(_) => HttpResponse::InternalServerError().body("Failed to initialize verifier"),
    }
}

pub async fn verify(data: web::Json<VerifyPassportParams>) -> impl Responder {
    match verify_passport(
        data.dsc_proof.clone(),
        data.dsc.clone(),
        data.circuit.clone(),
    )
    .await
    {
        Ok(value) => HttpResponse::Ok().body(format!("Verification result: {:?}", value)),
        Err(err) => {
            HttpResponse::InternalServerError().body(format!("Verification failed: {}", err))
        }
    }
}
