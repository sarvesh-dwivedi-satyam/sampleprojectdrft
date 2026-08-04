num1 = int(input("Enter Number 1st: "))
opera = input("Enter Operations: ").strip()
num2 = int(input("Enter Number 2st: "))

sub = num1 - num2
add = num1 + num2
mul = num1 * num2
div = num1 / num2 

if opera == "-":
    print(f"Result = {sub}")
elif opera == "+":
    print(f"Result = {add}")
elif opera == "*":
    print(f"Result = {mul}")
elif opera == "/":
    print(f"Result = {div}")  
else:
    print("Error")