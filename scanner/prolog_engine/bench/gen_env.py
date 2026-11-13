"""Random environment generator for the search benchmark (seeded)."""
import random, sys

def gen(n, seed=1):
    rnd = random.Random(seed)
    nc, ns, nr, nu = max(1, n // 5), max(1, n // 10), max(2, n // 4), max(1, n // 20)
    nb = max(1, n - nc - ns - nr - nu)
    C = [f"vm{i}" for i in range(nc)]; S = [f"sg{i}" for i in range(ns)]
    R = [f"role{i}" for i in range(nr)]; U = [f"user{i}" for i in range(nu)]
    B = [f"bkt{i}" for i in range(nb)]
    out = []
    for c in C: out.append(f"resource({c}, aws, ec2_instance).")
    for s in S: out.append(f"resource({s}, aws, security_group).")
    for r in R: out.append(f"resource({r}, aws, iam_role).")
    for u in U: out.append(f"resource({u}, aws, iam_user).")
    for b in B: out.append(f"resource({b}, aws, s3_bucket).")
    for s in S:
        if rnd.random() < 0.3: out.append(f"open_to_internet({s}, 22).")
    for c in C:
        out.append(f"uses_network_rule({c}, {rnd.choice(S)}).")
        out.append(f"instance_identity({c}, {rnd.choice(R)}).")
    for r in R:                                   # trust edges, cycles allowed
        for q in rnd.sample(R, 2):
            if q != r: out.append(f"can_assume({r}, {q}).")
        for b in rnd.sample(B, min(2, len(B))):
            out.append(f"allows({r}, read, {b}).")
    for u in U:
        if rnd.random() < 0.5: out.append(f"console_login({u}).")
        if rnd.random() < 0.5: out.append(f"mfa_enabled({u}).")
        out.append(f"allows({u}, read, {rnd.choice(B)}).")
    for b in rnd.sample(B, max(1, nb // 10)): out.append(f"sensitive({b}).")
    return "\n".join(sorted(set(out))) + "\n"

if __name__ == "__main__":
    n = int(sys.argv[1]); open(f"env_{n}.pl", "w").write(gen(n))
