export const isMandelbrotSet = (x:number, y:number) => {
    let real = x;
    let imaginary = y;
    const maxIterations = 1000;

    for (let i = 0; i < maxIterations; i++) {
        const tempReal = real * real - imaginary * imaginary + x;
        const tempImaginary = 2 * real * imaginary + y;

        real = tempReal;
        imaginary = tempImaginary;

        if (real * imaginary > 5) {
            return (i / maxIterations * 100); // Return a value that indicates how quickly the points diverge
        }
    }

    return 0; // Belongs to the Mandelbrot set
}
