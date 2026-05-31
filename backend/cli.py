import sys
import requests

BASE_URL = "http://127.0.0.1:8000"

if len(sys.argv) < 2:

    print("\nGhostScout CLI\n")

    print("Commands:")
    print("  score")
    print("  jobs")
    print("  gaps")
    print("  roadmap")

    exit()

command = sys.argv[1]

if command == "score":

    data = requests.get(
        f"{BASE_URL}/market-score"
    ).json()

    print(
        f"\nMarket Readiness: "
        f"{data['score']}%\n"
    )

elif command == "gaps":

    gaps = requests.get(
        f"{BASE_URL}/skill-gaps"
    ).json()

    print("\nTop Skill Gaps:\n")

    for item in gaps:

        print(
            f"- {item['skill']} "
            f"({item['count']})"
        )

elif command == "roadmap":

    roadmap = requests.get(
        f"{BASE_URL}/roadmap"
    ).json()

    print("\nCareer Roadmap:\n")

    print(roadmap["roadmap"])

elif command == "jobs":

    jobs = requests.get(
        f"{BASE_URL}/jobs"
    ).json()

    print("\nTop Jobs:\n")

    for job in jobs[:5]:

        print(
            f"{job['company']} | "
            f"{job['role']} | "
            f"{job['score']}%"
        )

else:

    print("Unknown command")