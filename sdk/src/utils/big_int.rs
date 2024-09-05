use num_bigint::BigInt;

pub fn big_int_to_hex(big_int: &BigInt) -> String {
    let hex_str = big_int.to_str_radix(16);
    format!("{:0>32}", hex_str)
}
