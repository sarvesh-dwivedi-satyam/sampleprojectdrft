print("-" * 5, "Leap Year Finder", "-"* 5)

year = int(input("Enter year: "))
if year%4 == 0:
    print(f"{year} is a leap year.")
elif year%4 != 0:
    print(f"{year} is not a leap year.")
else:
    print("Error.......")