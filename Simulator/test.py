import math

def bisection(f, a, b, tol):
    """
    Perform the bisection method to find a root of f(x) in [a, b] within tolerance tol.
    """
    if f(a) * f(b) >= 0:
        raise ValueError("The function must have opposite signs at the endpoints.")

    iteration = 0
    while (b - a) / 2 > tol:
        c = (a + b) / 2
        if f(c) == 0:  # Exact root found
            break
        elif f(a) * f(c) < 0:
            b = c
        else:
            a = c
        iteration += 1
    return (a + b) / 2, iteration

# Part (a): Approximation of sqrt(3)
def f1(x):
    return x**2 - 3

root_a, iterations_a = bisection(f1, 1, 2, 1e-4)  # Interval [1, 2] because sqrt(3) is between 1 and 2
print(f"Root approximation for sqrt(3): {root_a} in {iterations_a} iterations")

# Part (b): Analysis of sin(pi * x)
def f2(x):
    return math.sin(math.pi * x)

# Test intervals
root_b1, _ = bisection(f2, -1, 0, 1e-4)  # Interval [-1, 0]
root_b2, _ = bisection(f2, 2, 3, 1e-4)  # Interval [2, 3]
print(f"Root in [-1, 0]: {root_b1}")
print(f"Root in [2, 3]: {root_b2}")

# Part (c): Generalized Bisection Method
def find_root(f, initial_point, tol):
    """
    Generalized root-finding method for a continuous function with an unknown interval.
    Expands the search range until a sign change is found.
    """
    step = 1  # Initial step size
    a, b = initial_point, initial_point + step
    while f(a) * f(b) >= 0:
        a -= step
        b += step
        step *= 2  # Exponentially expand the interval

    return bisection(f, a, b, tol)

# Test functions for part (c)
def f3(x):
    return math.log(x) - (6 * x) / (1 + x)

def f4(x):
    return 3 * x**3 - x**2 - 18 * x + 20

def f5(x):
    return x**3 - 6 * x**2 + 14 * x - 30

# Find roots
root_c1, _ = find_root(f3, 1, 1e-4)
root_c2, _ = find_root(f4, 0, 1e-4)
root_c3, _ = find_root(f5, 0, 1e-4)

print(f"Root for f(x) = log(x) - 6x/(1+x): {root_c1}")
print(f"Root for f(x) = 3x^3 - x^2 - 18x + 20: {root_c2}")
print(f"Root for f(x) = x^3 - 6x^2 + 14x - 30: {root_c3}")
