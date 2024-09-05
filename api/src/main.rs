use std::{sync::Mutex};

use actix_web::{get, guard, post, web, App, HttpRequest, HttpResponse, HttpServer, Responder};
use openssl::ssl::{SslAcceptor, SslFiletype, SslMethod};

struct AppState {
    app_name: String,
}

struct AppStateWithCounter {
    counter: Mutex<i32>,
}

// async fn index(data: web::Data<AppStateWithCounter>) -> impl Responder {
//     let mut counter = data.counter.lock().unwrap();
//     *counter += 1;

//     format!("Request number: {counter}")
// }

#[get("/")]
async fn index(_req: HttpRequest) -> impl Responder {
    "Welcome!"
}

#[post("/echo")]
async fn echo(req_body: String) -> impl Responder {
    HttpResponse::Ok().body(req_body)
}

async fn manual_hello() -> impl Responder {
    HttpResponse::Ok().body("Hey there!")
}

// #[actix_web::main]
// async fn main() -> std::io::Result<()> {
//     let counter = web::Data::new(AppStateWithCounter {
//         counter: Mutex::new(0)
//     });

//     HttpServer::new(move || {
//         App::new()
//         .app_data(counter.clone())
//         .route("/", web::get().to(index))
//     })
//     .bind(("127.0.0.2", 8080))?
//     .run()
//     .await

//     // HttpServer::new(|| {
//     //     App::new()
//     //         .app_data(web::Data::new(AppState {
//     //             app_name: String::from("Actix Web")
//     //         }))
//     //         .service(index)
//     //         .service(echo)
//     //         .route("/hey", web::get().to(manual_hello))
//     // })
//     // .bind(("127.0.0.1", 8080))?
//     // .run()
//     // .await
// }

// #[actix_web::main]
// async fn main() -> std::io::Result<()> {
//     HttpServer::new(|| {
//         App::new()
//             .service(
//                 web::scope("/")
//                     .guard(guard::Host("www.rust-lang.org"))
//                     .route("", web::to(|| async { HttpResponse::Ok().body("www") })),
//             )
//             .service(
//                 web::scope("/")
//                     .guard(guard::Host("users.rust-lang.org"))
//                     .route("", web::to(|| async { HttpResponse::Ok().body("user") })),
//             )
//             .route("/", web::to(HttpResponse::Ok))
//     })
//     .bind(("127.0.0.1", 8080))?
//     .run()
//     .await
// }

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let mut builder = SslAcceptor::mozilla_intermediate(SslMethod::tls()).unwrap();
    builder
        .set_private_key_file("./key.pem", SslFiletype::PEM)
        .unwrap();
    builder.set_certificate_chain_file("cert.pem").unwrap();

    HttpServer::new(|| App::new().service(index))
        .bind_openssl("127.0.0.2:8080", builder)?
        .run()
        .await
}
