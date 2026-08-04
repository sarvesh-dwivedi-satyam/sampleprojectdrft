print("-" * 5, "Even/ODD Checker", "-"* 5)
num = int(input("Enter Number: "))

if num%2 == 0:
    print(f"{num} is Even Number.")
elif num%2 != 0:
    print(f"{num} is Odd Number.")
else:
    print("Error.......")
