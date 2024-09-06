use std::path::PathBuf;

use deno_runtime::{
    deno_core::{resolve_path, serde_json, JsRuntime, RuntimeOptions},
    deno_napi::v8::{HandleScope, Local, Value},
};

pub async fn initialize_verifier(
    scope: String,
    attestation_id: Option<String>,
    requirements: Vec<(String, String)>,
    rpc_url: Option<String>,
    dev_mode: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let mut js_runtime = JsRuntime::new(RuntimeOptions::default());

    let path = PathBuf::from("./initializeVerifier.ts");
    let module_specifier = resolve_path(&*path.to_string_lossy(), &path)?;

    js_runtime.load_main_es_module(&module_specifier).await?;

    let requirements_json = serde_json::to_string(&requirements)?;
    let attestation_id = attestation_id.unwrap_or_else(|| "default_attestation_id".to_string());
    let rpc_url = rpc_url.unwrap_or_else(|| "https://example.com/rpc".to_string());

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
        scope, attestation_id, requirements_json, rpc_url, dev_mode
    );

    js_runtime.execute_script("<anon>", init_script)?;

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
