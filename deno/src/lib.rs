use std::{
    error::Error,
    path::{Path, PathBuf},
};

use deno_runtime::{
    deno_core::{resolve_path, resolve_url_or_path, serde_json, JsRuntime, RuntimeOptions},
    deno_napi::v8::Value,
};
use log::{error, info};

pub async fn initialize_verifier(
    scope: String,
    attestation_id: Option<String>,
    requirements: Option<Vec<(String, String)>>,
    rpc_url: Option<String>,
    dev_mode: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    // Log the start of the function
    println!("Starting the initialize_verifier function");
    println!("Starting the initialize_verifier function");

    let mut js_runtime = JsRuntime::new(RuntimeOptions::default());

    let module_specifier = resolve_url_or_path(
            "/home/isk/projects/pse/hackathon_2024/snark-verifier-server-rs/deno/src/openPassportVerifier.ts",
            Path::new("/")
        ).map_err(|e| {
            println!("Error resolving module specifier: {:?}", e);
            e
        })?;

    // Log the module specifier used
    println!("Module specifier resolved: {:?}", module_specifier);

    js_runtime
        .load_main_es_module(&module_specifier)
        .await
        .map_err(|e| {
            println!("Error load main es modules failed: {:?}", e);
            e
        })?;

    //let requirements_json = serde_json::to_string(&requirements)?;
    let attestation_id = attestation_id.unwrap_or_else(|| {
        println!("Attestation ID not provided, using default");
        "default_attestation_id".to_string()
    });
    let rpc_url = rpc_url.unwrap_or_else(|| {
        println!("RPC URL not provided, using default");
        "https://example.com/rpc".to_string()
    });

    // Log the initialization parameters
    println!(
        "Initializing verifier with scope: {}, attestationId: {}, rpcUrl: {}, dev_mode: {}",
        scope, attestation_id, rpc_url, dev_mode
    );

    let init_script = format!(
        r#"
        initializeVerifier({{
            scope: '{}',
            attestationId: '{}',
            requirements: {},
            rpcUrl: '{}',
            dev_mode: {}
        }});
    "#,
        scope, attestation_id, "None", rpc_url, dev_mode
    );

    // Log the script before execution
    println!("Executing script: {}", init_script);

    if let Err(e) = js_runtime.execute_script("<anon>", init_script) {
        // Log the error if script execution fails
        error!("Script execution failed: {}", e);
        return Err(Box::<dyn Error>::from(e));
    }

    // Log the success of the function
    println!("Verifier initialized successfully");

    Ok(())
}

pub async fn verify_passport(
    dsc_proof: Vec<String>,
    dsc: String,
    circuit: String,
) -> Result<Value, Box<dyn std::error::Error>> {
    let mut js_runtime = JsRuntime::new(RuntimeOptions::default());

    let path = PathBuf::from("./verifyPassport.ts");
    let module_specifier = resolve_path(&*path.to_string_lossy(), &path)?;

    js_runtime.load_main_es_module(&module_specifier).await?;

    let proof_json = serde_json::to_string(&dsc_proof)?;

    let verify_script = format!(
        r#"
        verifyPassport({{
            dscProof: {{
                publicSignals: {0},
                proof: {1}
            }},
            dsc: `{2}`,
            circuit: '{3}'
        }}).then(result => JSON.stringify(result));
    "#,
        proof_json, proof_json, dsc, circuit
    );

    let result = js_runtime.execute_script("<anon>", verify_script)?;

    // Use HandleScope from deno_runtime, not rusty_v8
    let scope = &mut js_runtime.handle_scope();
    let value = result.open(scope);

    Ok(*value)
}
