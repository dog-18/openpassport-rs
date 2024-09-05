use chrono::{Datelike, Duration, Utc};

fn get_current_date_yymmdd(day_diff: i64) -> Vec<u32> {
    let date = Utc::now() + Duration::days(day_diff);
    let year = date.year() % 100;
    let month = date.month();
    let day = date.day();

    let yy = format!("{:02}", year);
    let mm = format!("{:02}", month);
    let dd = format!("{:02}", day);

    let yymmdd = format!("{}{}{}", yy, mm, dd);
    yymmdd.chars().map(|c| c.to_digit(10).unwrap()).collect()
}

pub fn get_current_date_formatted() -> Vec<String> {
    get_current_date_yymmdd(0)
        .iter()
        .map(|&part| part.to_string())
        .collect()
}
