# openpassport-rs
> PSE Hackathon 2024

A server-side Rust implementation for verifying zkSnark (Groth16) proofs using Actix-Web.

<p align="center">
  <img src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fchinese.freecodecamp.org%2Fnews%2Fcontent%2Fimages%2F2021%2F02%2Frust-mascot.png&f=1&nofb=1&ipt=bff8f5f9c865cfc967823081b6262b939c47a90625b091dff9621c985ea071f4&ipo=images" alt="Rust Logo" width="100"/>
  <img src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.freepnglogos.com%2Fuploads%2Fplus-icon%2Ffile-plus-font-awesome-svg-wikimedia-commons-10.png&f=1&nofb=1&ipt=501afa973a0fa3f1e19d1225703b8ea648f7086eab5c526d8c10fe3627b7bf21&ipo=images" alt="Rust Logo" width="70"/>
  <img src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fassets.publishing.service.gov.uk%2Fgovernment%2Fuploads%2Fsystem%2Fuploads%2Fimage_data%2Ffile%2F104842%2Fepassport-GOVUK-960.png&f=1&nofb=1&ipt=02b39381b7e0538b3984bdaf3407d2b147e65f311e852aafa3a6ee784a77ae32&ipo=images" alt="OpenPassport Logo" width="100" l/>
</p>

## ⚠️ Under Development

This project is currently under development and is **not yet functional**.

## Overview 
This project aims to provide a robust solution for zkSnark proof verification using Rust. The project is structured into three main crates:

1. `openpassport-rs/sdk`: A Rust adaptation of the `@openpassport/sdk` library. Approximately 70% of the 1Step verification logic has been implemented.
2. `openpassport-rs/server`: A server built with Actix-Web that exposes endpoints for initializing the verifier and verifying proofs.
3. `openpassport-rs/deno`: A Deno crate that compiles TypeScript code, making it possible to run it within the Rust environment.

## Development Status

- The SDK is currently about 70% complete for the 1Step verification process.
- The server is functional but still in development.
- The Deno integration is in the experimental phase blocked by [openpassport/issues/190](https://github.com/zk-passport/openpassport/issues/190).

## Project Structure
Here’s a visual representation of the folder hierarchy:

```
.
├── sdk
│   ├── Cargo.toml
│   ├── circuits
│   └── src
├── api
│   ├── Cargo.toml
│   └── src
├── deno
│   ├── Cargo.toml
│   └── src
├── LICENSE
├── README.md
└── target
```
## Getting Started

### Prerequisites: 
To get started with this project:

**1. Clone the repository:**
```bash
git clone https://github.com/yourusername/openpassport-rs.git
cd openpassport-rs
```

**2. Set up the SDK:**
```bash
cd sdk
cargo build
```

**3. Run the Server:**
Navigate to the server directory and run the Actix-Web server:
```bash
cd ../server
cargo run
```

**4. Set up Deno:**
Navigate to the deno directory and make sure Deno is installed. Run the Deno scripts:
```bash
cd ../deno
deno run --allow-read --allow-net src/openPassportVerifier.ts
```
> Note: The crate is currently blocked due to an issue with the `@openpassport/sdk` TS package. You can follow the progress or contribute to the discussion in [openpassport/issues/190](https://github.com/zk-passport/openpassport/issues/190)

**5. API Endpoints**
- Initialize Verifier:
    - Endpoint: `/initialize`
    - Method: `POST`
    - Description: Initializes the verifier with the given parameters.

- Verify Passport:
  - Endpoint: `/verify`
  - Method: `POST`
  - Description: Verifies the passport proof.

## License

This project is licensed under the MIT License.
