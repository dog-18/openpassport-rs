pub mod apis;

use actix_cors::Cors;
use actix_web::{web, App, HttpServer};
use apis::{index, initialize, verify};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .wrap(
                Cors::default()
                    .allowed_origin("http://localhost:3000")
                    .allowed_methods(vec!["GET", "POST"])
                    .allowed_headers(vec!["Content-Type"])
                    .max_age(3600),
            )
            .route("/", web::get().to(index))
            .route("/initialize", web::post().to(initialize))
            .route("/verify", web::post().to(verify))
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
