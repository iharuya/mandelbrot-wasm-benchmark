mod utils;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, mandelbrot-wasm!");
}

#[wasm_bindgen]
pub fn is_mandelbrot_set(x: f64, y: f64) -> f64 {
    let mut real = x;
    let mut imaginary = y;
    let max_iterations = 1000;

    for i in 0..max_iterations {
        let temp_real = real * real - imaginary * imaginary + x;
        let temp_imaginary = 2.0 * real * imaginary + y;

        real = temp_real;
        imaginary = temp_imaginary;

        if real * imaginary > 5.0 {
            return i as f64 / max_iterations as f64 * 100.0;
        }
    }

    0.0
}