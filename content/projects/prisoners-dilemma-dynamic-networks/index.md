---
title: "Prisoner's Dilemma in Dynamic Network Topologies: Agent-Based Simulation Framework"
description: "Agent-based simulation of the iterated Prisoner's Dilemma on adaptive networks. Explores how cooperation emerges through imitation (Fermi Rule), dynamic rewiring, and Pareto wealth across Erdős-Rényi and Barabási-Albert topologies."
summary: "Agent-based simulation of the iterated Prisoner's Dilemma on adaptive networks. Explores how cooperation emerges through imitation (Fermi Rule), dynamic rewiring, and Pareto wealth across Erdős-Rényi and Barabási-Albert topologies."
date: 2025-12-21
lastmod: 2026-02-23
featureAlt: "Illustration of the Prisoner's Dilemma on a network with a cooperative green agent and a defecting red agent"
coverAlt: "Cartoon showing a cooperative green agent and a defecting red agent interacting within a network structure"
coverCaption: "Visual representation of cooperation and defection dynamics in a networked Prisoner's Dilemma scenario."
thumbnailAlt: "Prisoner's Dilemma network illustration"
categories: ["research", "software"]
tags: ["prisoners-dilemma", "game-theory", "evolutionary-game-theory", "agent-based-modeling", "network-dynamics", "network-science", "complex-networks", "cooperation", "cooperation-emergence", "cultural-evolution", "fermi-rule", "complex-systems", "simulation", "memory-one", "tit-for-tat", "trembling-hand", "barabasi-albert", "erdos-renyi", "scale-free-networks", "wealth-inequality", "pareto-distribution", "python", "networkx", "numpy", "matplotlib", "undergraduate-thesis", "unal"]
---

# Prisoner's Dilemma in Dynamic Network Topologies: Agent-Based Simulation Framework

**Daniel Felipe Montenegro Herrera** · advised by **Juan David García Arteaga**
Universidad Nacional de Colombia — Systems and Computer Engineering

---

## 0. What is this project about?

Imagine a group of people who must constantly decide between cooperating or acting selfishly. When does cooperation survive? When does selfishness dominate? How does social network structure influence the outcome? What happens when people can break toxic relationships and form new friendships?

This project is a computational tool that simulates these social dynamics using the famous **Prisoner's Dilemma** on **dynamic networks**. It allows studying how cooperation evolves when:
- People learn by imitating their successful neighbors
- Social networks adapt (connections are broken and formed)
- Wealth is unequally distributed
- Survival depends on economic success

**Who this document is for:**
- Students and researchers interested in cooperation and social behavior
- People with basic university education (NO prior experience in game theory required)
- Anyone who can run basic Python programs

---

## 1. Introduction: The Problem of Cooperation

### 1.1 Why is it difficult to cooperate?

In our daily lives we constantly face situations where we must decide between:
- **Cooperate:** Help others, even if it costs us something
- **Defect:** Act selfishly, maximizing our immediate benefit

Concrete examples:
- In a group project: work hard (cooperate) or let others do the work (defect)?
- In traffic: let someone through (cooperate) or accelerate to gain a few seconds (defect)?
- In the use of shared resources: use what is needed (cooperate) or abuse them (defect)?

The dilemma arises because:
1. **If everyone cooperates**, everyone wins
2. **If everyone defects**, everyone loses
3. **But if I defect while YOU cooperate**, I win more (and you lose more)

This last option creates the temptation to defect. If each person reasons this way, we end up in a world where no one cooperates and everyone loses. However, **in real life cooperation exists and thrives**. How is this possible?

### 1.2 The science of cooperation

This problem has fascinated scientists for decades. Some key questions:

1. **Under what conditions does cooperation emerge?**
   - Does it matter if interactions are repeated?
   - Does it matter who interacts with whom?
   - Does it matter how people learn?

2. **How does cooperation survive in the face of selfishness?**
   - Can cooperators protect each other?
   - Do social networks favor any behavior?

3. **What happens when social networks are dynamic?**
   - If you can "disconnect" from selfish people, does everything change?
   - Does the formation of new friendships promote cooperation?

This project provides a tool to systematically explore these questions.

### 1.3 What makes this project different

Previous studies of the Prisoner's Dilemma generally:
- Use **static** networks (connections never change)
- Do not model initial economic inequality
- Use simplified evolution rules

**This framework integrates:**

- **Dynamic networks:** Agents can break unfavorable connections and form new ones

- **Realistic economy:** Unequal distribution of initial wealth (as in real life)

- **Cultural Evolution:** Agents learn by imitating successful neighbors (Fermi Rule)

Now that we understand **why** we study this, let us build the necessary theoretical concepts from scratch.

---

## 2. Foundations: Building from Scratch

This section introduces all the necessary theoretical concepts, explained gradually. If you are already familiar with game theory, you can skip directly to [Section 3](#3-the-model-integrating-the-concepts).

### 2.1 Game Theory: The science of strategic decisions

**Game theory** is the mathematical study of situations where the outcome of our decisions depends on the decisions of others.

**Simple example (non-strategic):**
- If I decide to use an umbrella, the outcome depends **only on the weather** (not on other people)
- This is NOT a game in the game theory sense

**Strategic example (it is a game):**
- If I decide to open a business, the outcome depends on **whether others also open businesses** in the area
- If many open businesses → competition → less profit for everyone
- If few open businesses → monopoly → high profits
- This IS a game: my outcome depends on others' decisions

**Elements of a game:**
1. **Players:** Who makes decisions (in our case: simulated agents)
2. **Actions:** What they can do (cooperate or defect)
3. **Payoffs:** What they gain or lose based on everyone's actions
4. **Information:** What they know when deciding

Game theory helps us understand which strategies are rational in different situations.

### 2.2 The Prisoner's Dilemma: The most famous game

#### The original story

Two suspects are arrested. The police separate them and make the same offer to each one:

- **If both stay silent** (cooperate with each other): 1 year in prison each
- **If both confess** (defect): 3 years in prison each
- **If one confesses and the other stays silent**: The one who confesses goes free, the one who stayed silent receives 5 years

**What would you do?**

Reasoning of each prisoner:
- "If my accomplice stays silent, it's better for me to confess (0 years vs 1 year)"
- "If my accomplice confesses, it's better for me to confess (3 years vs 5 years)"
- "In both cases, it's better for me to confess"

Result: **Both confess and receive 3 years**, when they would have been better off staying silent (1 year each).

#### Generalization: The payoff matrix

We can represent any similar dilemma with a payoff matrix:

```
                     Player 2
                Cooperate    Defect
              ┌─────────────────────┐
              │  R, R    │  S, T    │  Cooperate
   Player 1   ├─────────────────────┤
              │  T, S    │  P, P    │  Defect
              └─────────────────────┘
```

**Axelrod's classic values (used in this project):**
- **R (Reward):** 3 points if both cooperate
- **T (Temptation):** 5 points if I defect and the other cooperates
- **S (Sucker):** 0 points if I cooperate and the other defects
- **P (Punishment):** 1 point if both defect

**Crucial relationship:** T > R > P > S  (5 > 3 > 1 > 0)

This defines the dilemma:
- **T > R:** I am tempted to defect even if the other cooperates
- **R > P:** But we would both be better off if we both cooperated
- **P > S:** And if the other defects, it's better to defect too

```python
# This is how it is defined in the code:

DEFAULT_PAYOFF_MATRIX = PayoffMatrix(
    reward=3,      # Both cooperate
    temptation=5,  # I defect, you cooperate
    sucker=0,      # I cooperate, you defect
    punishment=1   # Both defect
)
```

**Key question:** If the dilemma is played **only once**, the rational strategy is to defect. But what happens if it is played **many times**?

### 2.3 Iteration: When the game repeats

Imagine that you don't play once, but **hundreds of times** with the same people. Now:

- You can **punish** whoever betrayed you (by defecting against them later)
- You can **reward** whoever cooperated (by cooperating back)
- Your **reputation** matters: if you always defect, no one will cooperate with you

This completely changes the game. Now cooperative strategies can thrive.

#### Example: Tit-for-Tat ("eye for an eye")

One of the most famous strategies is **Tit-for-Tat**, which can be popularly understood as "eye for an eye":

**Simple rule:**
1. In the first round: **cooperate**
2. In subsequent rounds: **do what the other did the previous round**

If the other cooperates → you cooperate

If the other defects → you defect (punishment)

If they cooperate again → you forgive and cooperate

**Why does it work well?**
- It is "nice" (never defects first)
- It is "retaliatory" (immediately punishes defection)
- It is "forgiving" (returns to cooperating if the other does)
- It is "clear" (easy for other players to understand)

_In Robert Axelrod's famous tournaments (1980), Tit-for-Tat consistently won against more complex strategies._

**In this project**, we simulate exactly this type of iterated interactions, where each pair of agents plays multiple rounds (normally a random number of rounds defined within a reasonable discrete range).

#### Trembling Hand: Errors in execution

Until now we have assumed that agents execute their strategies perfectly. But in reality, **people make mistakes**:
- A cooperator may accidentally defect due to misunderstanding
- A defector may cooperate due to a communication error
- Fatigue, distraction, or imperfect information cause involuntary deviations

This phenomenon is known in game theory as **"trembling hand"**, introduced by Reinhard Selten (Nobel Prize 1994).

**Concept:** With a small probability, an agent executes an action **different** from what its strategy dictates.

**Numerical example:**

```python
# My strategy says: COOPERATE in this round
my_intended_action = "cooperate"

# But with probability noise_probability, I "tremble" and do the opposite
if random() < noise_probability:  # Typically 0.001 (0.1%)
    my_actual_action = "defect"   # Execution error
    reason = "trembling_hand"
else:
    my_actual_action = "cooperate"  # Correct execution
```

**Interpretation with noise_probability = 0.001:**
- In 999 out of every 1000 rounds → I execute my strategy correctly
- In 1 out of every 1000 rounds → I "tremble" and execute the opposite

**Why model execution errors?**

1. **Realism:** Human interactions are never perfect
2. **Robustness:** Strategies that work under errors are more realistic
3. **Forgiveness:** Allows cooperators to forgive accidental errors
4. **Diversity:** Prevents total convergence to a single behavior

**Note:** Trembling hand is one of several noise/irrationality mechanisms in this model. Other mechanisms (which we will see in Section 2.5) affect **learning** of strategies, while trembling hand affects the **execution** of actions.

**Effect on iterated interactions:**

With trembling hand, even deterministic strategies like Tit-for-Tat become slightly stochastic:
- A pure Tit-for-Tat always cooperates with another Tit-for-Tat
- With trembling hand (0.1%), they occasionally defect by error
- This can initiate punishment-forgiveness cycles
- "Forgiving" strategies become evolutionarily advantageous

**Configuration:**

```yaml
simulation:
  noise_probability: 0.001  # 0.1% error in each decision
```

Typical values:
- `0.0` → Perfect execution (unrealistic)
- `0.001` (0.1%) → Rare but present errors (standard)
- `0.01` (1%) → Frequent errors (high noise)

### 2.4 Memory-One Strategies: Simplicity with power

What if instead of remembering **the entire history** of interactions, you only remember **the immediately previous result**? This is the idea behind **memory-one** strategies (first-order memory).

#### The S(p, q, r, s) representation

A memory-one strategy is defined by **four probabilities**:

- **p:** Probability of cooperating after both cooperated (CC)
- **q:** Probability of cooperating after I cooperated and the other defected (CD)
- **r:** Probability of cooperating after I defected and the other cooperated (DC)
- **s:** Probability of cooperating after both defected (DD)

**Example: Tit-for-Tat in memory-one notation**

```
S(p=1.0, q=0.0, r=1.0, s=0.0)
```

Why?
- After CC → cooperates with probability 1.0 (p=1.0)
- After CD → defects with certainty (q=0.0) ← punishment
- After DC → cooperates with probability 1.0 (r=1.0) ← forgiveness
- After DD → defects with certainty (s=0.0)

**Other classic strategies:**

```python
# Always Cooperate: Cooperates no matter what
always_coop = Strategy(p=1.0, q=1.0, r=1.0, s=1.0)

# Always Defect: Never cooperates
always_defect = Strategy(p=0.0, q=0.0, r=0.0, s=0.0)

# Win-Stay-Lose-Shift:
# If I did well, I repeat; if I did poorly, I switch
wsls = Strategy(p=1.0, q=0.0, r=0.0, s=1.0)

# Generous Tit-for-Tat:
# Like TFT, but sometimes forgives even if the other defected
gtft = Strategy(p=1.0, q=0.1, r=1.0, s=0.1)
```

#### The strategy space

With four parameters that can take values between 0.0 and 1.0, there are **infinite** possible memory-one strategies.

In this project, we discretize the space using a configurable "step":

```yaml
# Typical configuration
population:
  probability_step: 0.5  # Allows values: 0.0, 0.5, 1.0

# This generates: 3^4 = 81 possible strategies
# Examples: (0.0, 0.0, 0.0, 0.0), (0.0, 0.0, 0.0, 0.5), ..., (1.0, 1.0, 1.0, 1.0)
```

With a finer step (0.25), we would have 5^4 = 625 strategies. With step 0.1, we would have 11^4 = 14,641 strategies.

#### Classification: Altruists vs Selfish

To simplify the analysis, we classify each strategy as:

```python
cooperation_sum = p + q + r + s

if cooperation_sum >= 2.0:
    agent_type = "Altruist"     # Tendency to cooperate
else:
    agent_type = "Selfish"      # Tendency to defect
```

**Examples:**
- Always Cooperate: sum = 4.0 → Altruist
- Tit-for-Tat: sum = 2.0 → **Altruist** (included among altruists)
- Always Defect: sum = 0.0 → Selfish

This classification is simplified but useful for quick analysis of population composition.

Now that we understand what strategies are, a natural question arises: **How do agents decide to change their strategy?** This is where Cultural Evolution comes in.

### 2.5 Cultural Evolution: Learning from successful neighbors

In real life, people learn by observing others. If you see that your neighbor succeeds by doing something, you might imitate them. This is the principle of **success-based imitation**.

#### The Fermi Rule: Probabilistic imitation

The **Fermi Rule** models this process realistically:

**Question:** With what probability does agent A imitate agent B?

**Answer:**

```
P(A imitates B) = 1 / (1 + exp(β × (fitness_A - fitness_B)))
```

Where:
- **fitness_A, fitness_B:** Accumulated wealth or points of each agent
- **β (beta):** Selection intensity (typically β=100)

**Interpretation:**

| Situation | Exponent | Probability of imitating |
|-----------|----------|--------------------------|
| B much richer than A | Large negative | ~1.0 (almost certain) |
| B slightly richer | Small negative | ~0.6-0.7 (likely) |
| Equal | Zero | 0.5 (random) |
| A slightly richer | Small positive | ~0.3-0.4 (unlikely) |
| A much richer | Large positive | ~0.0 (almost impossible) |

**Step-by-step numerical example** (β=100):

```python
# Case 1: B is significantly more successful than A
fitness_A = 100 credits
fitness_B = 110 credits
fitness_diff = fitness_A - fitness_B = 100 - 110 = -10

fermi_prob = 1 / (1 + exp(β × fitness_diff))
           = 1 / (1 + exp(100 × (-10)))
           = 1 / (1 + exp(-1000))
           = 1 / (1 + 0.0000...0)     # exp(-1000) ≈ 0
           ≈ 1.0                       # A imitates B with ~100% probability!

# Case 2: B is slightly more successful than A
fitness_A = 100 credits
fitness_B = 101 credits
fitness_diff = fitness_A - fitness_B = 100 - 101 = -1

fermi_prob = 1 / (1 + exp(100 × (-1)))
           = 1 / (1 + exp(-100))
           = 1 / (1 + 3.72×10⁻⁴⁴)     # exp(-100) ≈ 0
           ≈ 0.999...                  # Almost 100% probability

# Case 3: Equal fitness (tie)
fitness_A = 100 credits
fitness_B = 100 credits
fitness_diff = fitness_A - fitness_B = 100 - 100 = 0

fermi_prob = 1 / (1 + exp(100 × 0))
           = 1 / (1 + exp(0))
           = 1 / (1 + 1)
           = 0.5                       # 50% probability (random)

# Case 4: A is slightly more successful than B
fitness_A = 101 credits
fitness_B = 100 credits
fitness_diff = fitness_A - fitness_B = 101 - 100 = 1

fermi_prob = 1 / (1 + exp(100 × 1))
           = 1 / (1 + exp(100))
           = 1 / (1 + 2.69×10⁴³)       # exp(100) is enormous
           ≈ 0.000...                  # Almost 0% probability

# Case 5: A is much more successful than B
fitness_A = 110 credits
fitness_B = 100 credits
fitness_diff = fitness_A - fitness_B = 110 - 100 = 10

fermi_prob = 1 / (1 + exp(100 × 10))
           = 1 / (1 + exp(1000))
           = 1 / (1 + ∞)               # exp(1000) is astronomically large
           ≈ 0.0                       # Essentially impossible
```

**Intuitive conclusion:**
- If B earns **more** than A → A will probably imitate B
- If both earn **equally** → A imitates B with 50% probability
- If A earns **more** than B → A will probably NOT imitate B

With β=100, even small differences (1 credit) are enormously amplified, making imitation almost deterministic toward the more successful agent.

**Why use Fermi instead of "copy the most successful"?**

1. **Realism:** People do not always perfectly copy the most successful. There are errors, doubts, imperfect information.
2. **Exploration:** Allows slightly worse strategies to survive and potentially thrive later.
3. **Gradualism:** Smooth changes instead of abrupt changes.

#### Irrational Mutation: Exploration without evaluation

In reality, people do not always act rationally when learning. Sometimes:
- They copy someone on impulse (without evaluating if they are better)
- They experiment out of curiosity ("What if I try this?")
- They imitate out of fashion or social pressure, not effectiveness

**Concept:** With a small probability, an agent **copies the strategy of a random neighbor** without evaluating whether it is better or worse.

**Crucial distinction (two learning mechanisms):**

This project models **two layers** in the evolution of strategies:

| Layer | Mechanism | Parameter | Evaluation | Purpose |
|-------|-----------|-----------|------------|---------|
| **1. Irrational mutation** | Blind copy | `epsilon_mutation` | Does NOT evaluate fitness | Pure exploration |
| **2. Rational imitation** | Fermi Rule | `beta_fermi` | DOES evaluate fitness | Gradual exploitation |

**Implementation:**

```python
# Evolution process (each epoch, for each agent):

# === LAYER 1: IRRATIONAL MUTATION (epsilon_mutation) ===
# Pure exploration: copy without looking at performance
if random() < epsilon_mutation:  # Typically 0.001 (0.1%)
    neighbor = select_random_neighbor()
    copy_strategy(neighbor)  # Copy the COMPLETE strategy without evaluating
    reason = "irrational_mutation"

else:
    # === LAYER 2: RATIONAL IMITATION (Fermi Rule) ===
    # Gradual exploitation: copy based on relative success
    neighbor = select_random_neighbor()

    # Evaluate fitness difference
    fitness_diff = my_fitness - neighbor_fitness
    fermi_prob = 1.0 / (1.0 + exp(beta_fermi × fitness_diff))

    # Probabilistic decision based on success
    if random() < fermi_prob:
        copy_strategy(neighbor)
        reason = "rational_fermi_imitation"
    else:
        # Keep current strategy (neighbor not sufficiently better)
        reason = "keep_current_strategy"
```

**Parameter epsilon_mutation:**

```yaml
strategy_evolution:
  epsilon_mutation: 0.001  # 0.1% irrational mutation
```

Typical values:
- `0.0` → Zero exploration (risk of premature convergence)
- `0.001` (0.1%) → Minimal but present exploration (standard)
- `0.01` (1%) → Frequent exploration (high diversity)
- `0.1` (10%) → Dominant exploration (erratic behavior)

**Why do we need irrational mutation?**

1. **Exploration of the strategy space:** Without it, certain strategies would never be discovered
2. **Escape from local optima:** Allows exiting suboptimal equilibria
3. **Population diversity:** Prevents complete homogenization
4. **Realism:** People experiment and make mistakes

**Relationship with other noise mechanisms:**

We already saw in 2.3.1 the "trembling hand" (execution errors). Now we complete the picture:

| Mechanism | Where it occurs | Parameter | Example |
|-----------|----------------|-----------|---------|
| **Trembling hand** | Action execution | `noise_probability` | "I meant to cooperate but defected" |
| **Irrational mutation** | Learning | `epsilon_mutation` | "I copied without checking if it works" |
| **Fermi (finite β)** | Evaluation | `beta_fermi` | "I copied even though it's worse" |

All three mechanisms model different aspects of imperfect human behavior.

#### Partial Strategy Copy: Gradual learning

Until now we have assumed that when an agent decides to imitate another (via Fermi), it **completely copies** all 4 parameters of their strategy (p, q, r, s). But in reality, **learning tends to be gradual**:
- A student does not copy everything from their mentor, only some techniques
- A merchant adopts some practices from their successful competitor, not all
- A company imitates certain aspects of another, while maintaining its own identity

**Motivating question:** Why copy everything if only part of the other's strategy is responsible for their success?

**Concept:** Instead of all-or-nothing copying, agents copy **partially** according to how superior the neighbor is. The greater the wealth difference, the more parameters are copied.

**Threshold logic:**

```python
# Calculate relative wealth ratio
wealth_ratio = neighbor_credits / my_credits

# Determine how many parameters to copy based on superiority
if wealth_ratio >= 2.0:
    num_params = 4  # Complete copy
elif wealth_ratio >= 1.5:
    num_params = 3  # Copy almost everything
elif wealth_ratio >= 1.25:
    num_params = 2  # Partial copy
else:
    num_params = 1  # Minimum experimentation
```

**Threshold table:**

| Wealth ratio | Parameters copied | Psychological interpretation |
|--------------|-------------------|------------------------------|
| ≥ 2.0× (200%) | 4 (all) | "They doubled my wealth! I fully trust them, I copy everything" |
| ≥ 1.5× (150%) | 3 (random) | "They are considerably better, I adopt almost all of their strategy" |
| ≥ 1.25× (125%) | 2 (random) | "They are a bit better, I partially try it out" |
| < 1.25× | 1 (random) | "Only slightly better, I experiment minimally" |

**Step-by-step numerical example:**

```python
# Initial situation
my_strategy = S(p=0.5, q=0.5, r=0.0, s=1.0)     # Me (strategy A)
my_credits = 100

neighbor_strategy = S(p=1.0, q=1.0, r=0.5, s=0.0)  # Neighbor (strategy B)
neighbor_credits = 150

# Step 1: Calculate ratio
wealth_ratio = 150 / 100 = 1.5

# Step 2: Determine number of parameters (according to table)
# ratio = 1.5 ≥ 1.5 → copy 3 parameters

# Step 3: Randomly select 3 of the 4 parameters
params_to_copy = random.sample(['p', 'q', 'r', 's'], 3)
# Suppose the result is: ['p', 'r', 's']

# Step 4: Copy only those parameters
my_new_strategy = S(
    p=1.0,   # Copied from neighbor
    q=0.5,   # Kept (not selected)
    r=0.5,   # Copied from neighbor
    s=0.0    # Copied from neighbor
)
```

**Result:** **Hybrid strategies** emerge that did not exist previously:
- My original strategy: S(0.5, 0.5, 0.0, 1.0)
- Neighbor's strategy: S(1.0, 1.0, 0.5, 0.0)
- My new strategy: S(1.0, 0.5, 0.5, 0.0) ← **Unique hybrid**

**Why is partial copy better than complete copy?**

1. **Gradualism:** Smooth behavioral changes instead of abrupt jumps
2. **Diversity:** Generates new strategies through recombination
3. **Exploration:** Broader search of the strategy space
4. **Realism:** Models how people actually learn (selective adaptation)
5. **Robustness:** Does not depend on EVERYTHING about the neighbor being good

**Comparison: Complete copy vs partial copy**

| Aspect | Complete copy | Partial copy |
|--------|---------------|--------------|
| Diversity | Low (only initial strategies) | High (new combinations) |
| Speed | Fast convergence | Gradual convergence |
| Adaptation | All-or-nothing | Selective |
| Exploration | Limited | Broad |

**Configuration:**

```yaml
strategy_evolution:
  enable_partial_copy: true                  # Enable mechanism
  copy_thresholds: [1.25, 1.5, 2.0]          # Ratio thresholds
  irrational_partial_prob: 0.05              # Probability of irrational partial copy
```

Parameters:
- `enable_partial_copy: false` → Classic complete copy (always 4 parameters)
- `enable_partial_copy: true` → Gradual copy based on relative wealth
- `copy_thresholds` → Ratio thresholds for 2, 3, 4 parameters
- `irrational_partial_prob` → Probability of performing partial copy even with epsilon_mutation

**Suggested experiments:**

To empirically validate the effect of partial copy, see Use Case 2 (Section 4.4) which compares:
- Partial copy vs complete copy
- Effect on diversity of emerging strategies
- Effect on population survival time

Now that we understand how strategies evolve, we need to understand **where** these interactions take place. People do not interact with everyone, but with their **social network**.

### 2.6 Social Networks: Who do you play with?

In classical models, everyone plays against everyone ("well-mixed population"). But in real life:
- You only interact with a subset of the population (your social network)
- Your network has structure (friends, friends of friends, etc.)
- The structure dramatically affects the results

#### Basic network concepts

A **network** (or graph) consists of:
- **Nodes:** Individual agents (simulated people)
- **Edges:** Connections between agents (who interacts with whom)

**Visual example:**
```
    A━━━B━━━C
    ┃   ┃   ┃
    D━━━E━━━F
```

In this network:
- There are 6 agents (A, B, C, D, E, F)
- Agent **B** is connected to: A, C, E (has 3 neighbors)
- Agent **E** is connected to: B, D, F (has 3 neighbors)
- When B plays the Prisoner's Dilemma, it only plays against its neighbors: A, C, and E
- When B can imitate someone, it can only imitate one of its neighbors: A, C, or E

**Degree of a node:** Number of connections an agent has
- Agent B: degree = 3 (has 3 neighbors)
- Agent A: degree = 2 (has 2 neighbors: B and D)

This concept is important because:
- It determines how many games each agent plays per epoch
- It defines the set of strategies it can observe and imitate

**Why does network structure matter?**

In classical models of the Prisoner's Dilemma, everyone plays against everyone ("well-mixed population"). But in real life:
- You only interact with a subset of the population (your social network)
- Your network has specific structure (random connections? are there influencers?)
- **The structure dramatically affects the results**

This project compares two fundamental types of networks that represent extremes of the spectrum of social organization:

---

### 2.7 Erdős-Rényi Topology: Homogeneous Random Networks

**What is it?**

An **Erdős-Rényi network** (also called a random network) is built in the simplest possible way:

```
Rule: For each possible pair of agents (A, B):
       Flip a coin with probability p
       If heads → create connection A-B
       If tails → do not connect
```

**Relationship with classical models:**

In classical evolutionary game theory, the "**well-mixed population**" model is used, where any agent can interact with any other with equal probability (everyone plays against everyone). Erdős-Rényi is a version with network constraints: not everyone is connected to everyone, but among those who ARE connected, these connections are formed in a completely random and equiprobable way.

**Parameters:**
- `num_nodes`: number of agents in the network
- `edge_probability`: probability of connection between each pair (typically 0.05 - 0.15)

**Visualization of the result:**

```
Example: 10 agents, probability p=0.2

A━━━B━━━C
┃   ┃   ┃
D━━━E━━━F
        ┃
    G━━━H━━━I
            ┃
            J
```

**Observed characteristics:**
- Average degree (2.2): A(2), B(3), C(2), D(2), E(3), F(3), G(1), H(3), I(2), J(1)
- Degree range: 1-3 connections (small variation)
- Homogeneous distribution: everyone has similar connections
- No "super-connected" nodes (hubs) nor "extremely isolated" ones

**Mathematical properties:**

The beauty of Erdős-Rényi lies in its **mathematical predictability**:

**Expected number of edges:**
```
E[edges] = n × (n-1) × p / 2

Where:
- n = number of nodes
- n × (n-1) = number of possible node pairs
- p = connection probability
- We divide by 2 because each edge is counted once (A-B is the same as B-A)

Example with n=10, p=0.2:
E[edges] = 10 × 9 × 0.2 / 2 = 9 expected edges
(The visual example above has 10, slightly above by chance)
```

**Expected average degree:**
```
E[degree] = (n-1) × p

Example with n=10, p=0.2:
E[degree] = 9 × 0.2 = 1.8 ≈ 2 connections per agent
```

**Degree distribution:**

The distribution follows a **Poisson distribution** (bell shape). This means that:
- Most nodes have degrees close to the average (1.8 ≈ 2)
- Very few nodes have very high or very low degrees
- The average (2) DOES represent the network well
- Homogeneous distribution: everyone is "similar"

**Code:**
```python
# num_nodes = number of agents
# edge_probability = connection probability between each pair
erdos_renyi = ErdosRenyiTopology(num_nodes=50, edge_probability=0.1)
erdos_renyi.generate_network()
```

**Impact on cooperation:**
- All agents have similar influence (democratic structure)
- Behaviors spread uniformly in all directions
- Cooperators and selfish agents compete on equal structural ground
- More predictable and stable dynamics than in heterogeneous networks
- Serves as **control baseline** for comparison with more realistic networks

---

### 2.8 Barabási-Albert Topology: Scale-Free Networks

**What is it?**

A **Barabási-Albert network** (or scale-free network) models real social networks through **preferential attachment**:

```
Growth algorithm:
1. Start with m₀ initially fully connected nodes
2. For each new node entering the network:
   - It connects with m existing nodes
   - Probability of connecting with node i:

     P(connect with i) = degree(i) / total_degree_sum

   → Popular nodes have a higher probability of gaining more connections
   → "The rich get richer"
```

**Parameters:**
- `num_nodes`: final number of nodes in the network
- `num_edges_attach`: number of connections each new node makes (parameter m)

**Visualization of the construction process:**

```
Step 1: Initial network (m₀=3, all connected)

    A━━━B
     ╲ ╱
      C

Degrees: A=2, B=2, C=2
Total degree sum: 6


Step 2: D enters (must make m=2 connections)
Connection probabilities:
  P(connect with A) = degree(A) / sum = 2/6 = 33.3%
  P(connect with B) = degree(B) / sum = 2/6 = 33.3%
  P(connect with C) = degree(C) / sum = 2/6 = 33.3%

→ All have the SAME probability (no preference yet)

Result (random): D connects with A and C

    A━━━B
    ┃╲ ╱
    ┃ C
    ┃ ┃
    D━┛

Degrees: A=3, B=2, C=3, D=2
Total degree sum: 10


Step 3: E enters (must make m=2 connections)
Connection probabilities:
  P(connect with A) = degree(A) / sum = 3/10 = 30%  ← HIGHER
  P(connect with B) = degree(B) / sum = 2/10 = 20%
  P(connect with C) = degree(C) / sum = 3/10 = 30%  ← HIGHER
  P(connect with D) = degree(D) / sum = 2/10 = 20%

→ NOW there IS preference: A and C have higher probability (30% vs 20%)

Result (most likely): E connects with A and C

    ┏━━━━━E
    ┃     ┃
    A━━━B ┃
    ┃╲ ╱  ┃
    ┃ C━━━┛
    ┃ ┃
    D━┛

Degrees: A=4, B=2, C=4, D=2, E=2
Total degree sum: 14

→ A and C increase their advantage (now have 4 connections each)
→ B and D fall behind (only 2 connections)
```

**Consequences of the mechanism:**
- **Hierarchical structure:** Few highly connected (hubs), many poorly connected (peripherals)
- **Early mover advantage:** A and C became hubs because they were there from the start
- **Growing inequality:** With more iterations, the gap between hubs and peripherals increases
- **Realism:** Models real social networks (influencers vs regular users)

**Mathematical properties:**

Unlike Erdős-Rényi, Barabási-Albert generates **extremely heterogeneous** distributions:

**Number of edges:**
```
edges = m × (n - m₀)

Where:
- m = connections each new node makes
- n = total final number of nodes
- m₀ = size of the initial network (typically m₀ = m + 1)

Example with n=50, m=2:
edges = 2 × (50 - 3) = 94 connections
```

**Degree distribution:**

The distribution follows a **power law**: P(k) ∝ k^(-3)

In plain words: the probability of having k connections decreases as 1/k³. This generates an extremely unequal distribution.

Typical example with 50 nodes (m=2):
- 1-2 super hubs: 15-20 connections
- 5-10 moderate hubs: 5-8 connections
- 35-40 peripherals: 1-3 connections

**Average degree:**
```
E[degree] = 2m  (approximately constant)

Example with m=2:
E[degree] = 2 × 2 = 4 connections per agent
```

**WARNING about the average:**

The average (4) is **misleading** in Barabási-Albert because:
- Super hubs have 15-20 connections (5 times the average!)
- Peripherals have 1-3 connections (below average)
- The MAJORITY of nodes are below average
- The average is inflated by the few super hubs

This is the opposite of Erdős-Rényi where the average DOES represent the network well.

**Code:**

```python
# num_nodes = total final number of nodes
# num_edges_attach = how many connections each new node makes (m)
barabasi = BarabasiAlbertTopology(num_nodes=50, num_edges_attach=2)
barabasi.generate_network()
```

**Impact on cooperation:**
- **Hubs dominate the evolutionary dynamics**
- If a hub is a cooperator → it broadly promotes cooperation
- If a hub is selfish → it can spread selfishness to many
- Extreme heterogeneity in social influence
- More complex and unpredictable dynamics than Erdős-Rényi

---

### 2.9 Comparison: Erdős-Rényi vs Barabási-Albert

| Characteristic | Erdős-Rényi | Barabási-Albert |
|----------------|-------------|-----------------|
| **Construction** | Random (fixed probability) | Growth + preferential attachment |
| **Degree distribution** | Poisson (bell curve) | Power law (long tail) |
| **Structure** | Homogeneous | Heterogeneous (hubs + peripherals) |
| **Social realism** | Low (theoretical baseline) | High (models real networks) |
| **Influence** | Equal | Concentrated in hubs |
| **Cooperation diffusion** | Uniform | Dominated by hub strategy |

Now that we understand static networks, what happens if **networks can change**? Agents can break harmful relationships and form new alliances.

### 2.10 Dynamic Networks: When friendships change

In real life, social networks are not static:
- You end friendships that do not work
- You make new friends through acquaintances
- You meet new people in different contexts

This project implements **three mechanisms** of network dynamics that model how social connections evolve:

#### Mechanism 1: Edge Removal (Breaking harmful relationships)

**Idea:** If someone consistently defeats you in interactions, you might distance yourself from that person.

**Rule:**
```python
# For each neighbor V of agent A:
defeat_ratio = defeats_of_A_vs_V / total_games

if defeat_ratio > threshold:  # typically 60%
    break_probability = defeat_ratio

    if random() < break_probability:
        remove_edge(A, V)
```

**Example:**
- You have played 10 times against your neighbor Juan
- Juan has defeated you 8 times (defeat_ratio = 0.8 = 80%)
- 80% > 60% (threshold) → you consider breaking the relationship
- With 80% probability, you remove the connection with Juan

**Effect on dynamics:**
- Successful selfish agents can **lose victims** (cooperators move away)
- If a selfish agent loses all connections → becomes **isolated** → **dies**
- Protects clusters of cooperators (they can isolate themselves from selfish agents)

**Irrational layer (ε=0.01):**
- With 1% probability, you break a random relationship (without evaluating history)
- Or maintain a harmful relationship (error)

#### Mechanism 2: Triadic Closure (Friends of friends)

**Idea:** Granovetter (1973) observed that in real social networks, ~40% of new connections are "friends of friends".

**Rule:**
```
"My friend's friend becomes my friend"

    A━━━B           A━━━B━━━┓
        ┃       →       ┃   ┃
        C━━━D           C━━━D

D is C's friend, C is B's friend → D becomes B's friend
```

**Implementation:**
```python
candidates = friends_of_friends(agent) - direct_friends(agent)

for candidate in candidates:
    relative_success = candidate_credits / population_average

    if relative_success > 1.25:  # 25% richer than average
        connection_prob = 0.15    # 15% probability
    else:
        connection_prob = 0.05    # 5% probability

    if random() < connection_prob:
        create_edge(agent, candidate)
```

**Effect:**
- **Triangle closure:** Increases local network density (friends of friends become friends)
- **Success bias:** Preference (3x higher probability) for connecting with agents >25% richer than average
- **Cluster formation:** Tends to create more cohesive and densely connected groups
- **Distance reduction:** People become closer in the network (fewer degrees of separation)

#### Mechanism 3: Weak Ties (Meeting strangers)

**Idea:** Granovetter (1973) also showed that "weak ties" (distant acquaintances) are crucial for spreading information between communities.

**Rule:**
```python
# With low probability (2% per agent per epoch):
if random() < 0.02:
    non_neighbors = get_unconnected_agents(agent)
    stranger = random.choice(non_neighbors)
    create_edge(agent, stranger)
```

**Effect:**
- **Prevents fragmentation:** Connects clusters that would have become isolated
- **Innovation diffusion:** Successful strategies spread between communities
- **Bridges:** Creates "bridges" between social groups

#### Mechanism 4: Irrational Rejection of Interactions

Unlike the **rational removal of edges** (Mechanism 1), where agents systematically evaluate the performance of their connections before removing them, **irrational rejection** models situations where an agent simply **refuses to play** with a neighbor in a specific epoch, without performing any prior analysis.

**What situations does it model?**

This mechanism captures unpredictable aspects of human behavior:
- **Temporary personal conflicts:** "Today I don't feel like talking"
- **Unavailability:** Illness, travel, busy schedule
- **Emotional states:** Anger, frustration, momentary distrust
- **Communication errors:** Forgetfulness, misunderstandings

**Key differences with rational removal:**

| Aspect | Irrational rejection | Rational removal |
|--------|---------------------|-----------------|
| **Evaluation** | Does not analyze performance | Evaluates defeat history |
| **Permanence** | Temporary (1 epoch) | Permanent (removes edge) |
| **Probability** | `epsilon_refuse` (~0.5%) | Based on `defeat_threshold` (60%) |
| **Network structure** | Connection remains intact | Connection disappears from graph |
| **Purpose** | Model human irrationality | Optimize contact network |

**Implementation:**

```python
# Each epoch, before playing:
for agent in agents:
    for neighbor in neighbors(agent):
        if random() < epsilon_refuse:
            # They do NOT play this epoch, but the edge persists
            skip_interaction(agent, neighbor)
            # Next epoch they will be able to play normally
```

**Configuration parameters:**

```yaml
network_dynamics:
  interaction_refusal:
    enable: false              # Disabled by default
    epsilon_refuse: 0.005      # 0.5% rejection probability per neighbor
```

- **`enable`:** Activates/deactivates the mechanism completely
- **`epsilon_refuse`:** Probability that an agent refuses to play with each neighbor in each epoch
  - Typical value: 0.005 (0.5%) - occasional rejections
  - High values: 0.05 (5%) - frequent conflicts

**Expected effect:**

- High values of `epsilon_refuse` increase the frequency of rejected interactions, reducing the total number of games per epoch
- Irrationality introduces **noise** into the dynamics without permanently altering the network structure
- Complements rational removal: an agent can maintain valuable connections but occasionally fail to use them

#### Integration of the four mechanisms

In each epoch of the simulation, the mechanisms are executed in this order:

1. **Irrational rejection:** Determine which interactions are skipped (temporary)
2. **Games:** Prisoner's Dilemma between connected neighbors (who did not reject each other)
3. **Edge removal:** Eliminate unfavorable relationships (permanent, rational)
4. **Triadic closure:** Connect friends-of-friends
5. **Weak ties:** Meet strangers
6. **Check isolated agents:** Detect agents that ended up without connections

```python
# Complete flow of one epoch:

# 1. Determine irrational rejections (optional)
refused_pairs = process_interaction_refusal()  # epsilon_refuse

# 2. Games (except pairs that rejected each other)
for connected_pair in network.edges():
    if connected_pair not in refused_pairs:
        play_prisoners_dilemma(connected_pair)

update_credits()  # ±1 per win/loss

# 3. Check deaths
process_deaths()  # Credits ≤ 0 or isolation → death
if death_detected():
    terminate_simulation()  # First death! END

# 4. Strategy evolution
evolve_strategies()  # Fermi Rule + partial copy

# 5. Network dynamics (3 rational mechanisms)
remove_unfavorable_edges()      # Mechanism 1 (rational)
create_triadic_connections()    # Mechanism 2
create_weak_ties()              # Mechanism 3

# 6. Check new isolated agents (from edge removal)
process_deaths()
if death_detected():
    terminate_simulation()
```

Now that we understand all the individual mechanisms, we need one final element: **the economy that determines who survives**.

### 2.11 Survival Economy: Wealth, inequality, and death

#### The credit system

Each agent has **credits** (money, resources, energy). After each game:

```python
# Game between A and B (5-20 random rounds)
score_A, score_B = play_prisoners_dilemma(A, B, rounds)

# Determine winner
if score_A > score_B:
    credits[A] += 1   # A wins
    credits[B] -= 1   # B loses
elif score_B > score_A:
    credits[A] -= 1   # A loses
    credits[B] += 1   # B wins
else:
    # Tie: no changes
    pass
```

**Properties:**
- **Local zero-sum system**: each game redistributes wealth (±1)
- Ties do not affect credits (avoids inflation/deflation)
- Long-term accumulation depends on strategy and network

#### Initial distribution: The Pareto Principle

In real life, wealth is **unequally** distributed. The famous "80-20 Principle" says:
- The richest 20% holds ~80% of total wealth

This project uses the **Pareto distribution** to model realistic inequality:

```python
# Typical configuration:
economy:
  total_wealth: 10000     # Total wealth to distribute
  pareto_alpha: 1.16      # Inequality parameter (80-20 rule)
  min_credits: 1          # No one starts with 0
```

**Why does initial inequality matter?**

1. **Realism:** Reflects initial conditions of the real world
2. **Hypothesis:** Do the rich adopt different strategies than the poor?
3. **Survival:** Does initial wealth predict survival?
4. **Cooperation:** Does inequality favor cooperation or selfishness?

#### Death conditions

An agent dies when:

```python
# Condition 1: Bankruptcy
if credits[agent] < 0:
    death = True
    reason = "credit_exhaustion"

# Condition 2: Social isolation
if degree[agent] == 0:  # No connections
    death = True
    reason = "isolation"
```

**Simulation termination:**

The simulation terminates **immediately** when the **first death** occurs:

```python
if len(alive_agents) < initial_population:
    terminate_simulation()
    reason = "Death detected (isolation or bankruptcy)"
```

**This criterion:**
- Measures the robustness of the topology before the first failure
- Avoids modeling failure cascades in degenerate networks
- Provides a consistent metric ("time until first death") to compare topologies
- Captures the complete state of the network at the critical moment

#### External events: Fortune and Misfortune

To model unforeseen events (illness, inheritance, accident), with low probability (1% per agent per epoch):

```python
if random() < 0.01:
    percentage = random.randint(0, 20) / 100  # 0%, 1%, 2%... 20%

    if random() < 0.5:
        # FORTUNE
        credits[agent] += int(credits[agent] * percentage)
    else:
        # MISFORTUNE
        credits[agent] -= int(credits[agent] * percentage)
```

**Effect:** Introduces realistic randomness without dominating the dynamics.

---

Now that we have built all the theoretical foundations, let us integrate them into the **complete model**.

---

## 3. The Model: Integrating the Concepts

### 3.1 System Overview

The model integrates all the components described in a simulation cycle. The values shown are examples; all parameters are configured in `config.yaml` (see Section 3.2 and Appendix B).

**Initialization:**
- Population of *n* agents (example: 50) with random memory-one strategies
- Total wealth distributed according to Pareto (α=1.16, configurable minimum credits)
- Initial social network: Erdős-Rényi or Barabási-Albert (configurable parameters)

**Cycle per epoch** (until first death or epoch limit):

1. **Irrational rejection** (optional):
   - Each agent may refuse to play with each neighbor (probability `epsilon_refuse`)
   - The connection remains, only the interaction is skipped this epoch

2. **Interactions:**
   - Each connected pair (that did not reject each other) plays Prisoner's Dilemma
   - Number of rounds: random within configured range (e.g.: 5-20)
   - Optional noise in decisions - trembling hand (see Section 2.3.1, parameter `noise_probability`)

3. **Economy:**
   - Winner: +1 credit
   - Loser: -1 credit
   - Tie: no change (local zero-sum system)

4. **Survival check:**
   - Death if: credits ≤ 0 **OR** degree = 0
   - If death occurs → **Terminate simulation immediately**
   - Save complete final state of the network

5. **Strategy evolution** (if no death occurred):
   - Each agent compares its performance with a random neighbor
   - Fermi Rule: probability of copying successful strategy (see Section 2.5.1)
   - Optional partial copy based on wealth thresholds (see Section 2.5.3)
   - Irrational mutation with probability `epsilon_mutation` (see Section 2.5.2)

6. **Network dynamics** (4 optional mechanisms):
   - **Removal:** Eliminate unfavorable edges (rational evaluation of history)
   - **Triadic:** Create connections between friends-of-friends
   - **Weak ties:** Random long-range connections
   - **Rejection:** Already executed in step 1 (temporary, does not modify structure)

7. **External events** (configurable probability, typically 1%):
   - Fortune: random credit gain (0-20%)
   - Misfortune: random credit loss (0-20%)

8. **Logging and visualization** (according to configuration):
   - Save epoch metrics (always)
   - Visualize network (every N epochs, if enabled)

9. **Check new isolated agents:**
   - In case edge removal left agents without connections
   - If death occurs → **Terminate simulation**

**Termination:**
- **Main condition:** First death detected (bankruptcy or isolation)
- **Alternative condition:** Reaching `max_epochs` without deaths
- **Output:** Results in JSON + visualizations (according to configuration)

### 3.2 Key Model Parameters

All parameters are configured in `config.yaml`:

```yaml
# === POPULATION ===
population:
  num_agents: 50              # Number of agents
  probability_step: 0.5       # Strategy discretization (0.0, 0.5, 1.0)

# === ECONOMY ===
economy:
  total_wealth: 10000         # Total wealth to distribute
  pareto_alpha: 1.16          # Inequality (80-20 rule)
  min_credits: 1              # Guaranteed minimum per agent

  external_events:
    enable: true              # Fortune/Misfortune
    probability: 0.01         # 1% per agent per epoch

# === STRATEGY EVOLUTION ===
strategy_evolution:
  enable: true
  epsilon_mutation: 0.001     # Irrational copy probability
  beta_fermi: 100.0           # Selection intensity

  enable_partial_copy: true   # Enable partial copy (see 2.5.3)
  copy_thresholds: [1.25, 1.5, 2.0]  # Wealth thresholds

# === NETWORK DYNAMICS ===
network_dynamics:
  enable: true

  edge_removal:               # Breaking toxic friendships
    enable: true
    defeat_threshold: 0.6     # >60% defeats → consider breaking
    epsilon_irrational: 0.01  # 1% irrationality
    history_window: 5         # Evaluate last 5 epochs

  triadic_closure:            # Friends of friends
    enable: true
    epsilon_irrational: 0.01
    base_probability: 0.05    # 5% for normal agents
    high_success_prob: 0.15   # 15% for successful agents

  weak_ties:                  # Weak ties
    enable: true
    probability: 0.02         # 2% per agent per epoch

  interaction_refusal:        # Irrational rejection
    enable: false             # Disabled by default
    epsilon_refuse: 0.005     # 0.5% rejection prob per neighbor

# === SIMULATION ===
simulation:
  max_epochs: 200             # Maximum epochs (if no deaths)
  min_game_turns: 5           # Minimum rounds per game
  max_game_turns: 20          # Maximum rounds per game
  noise_probability: 0.001    # Decision noise (0.1%)

# === TOPOLOGIES ===
erdos_renyi:
  probability: 0.1            # 10% connection probability

barabasi_albert:
  m: 2                        # 2 connections per new node

# === VISUALIZATION ===
visualization:
  save_visualizations: true
  epoch_interval: 10          # Save every 10 epochs

# === MULTI-EXPERIMENT ===
mega_experiment:
  num_populations: 10         # 10 different populations
  simulations_per_topology: 5 # 5 instances of each topology
  # Total: 10 × 5 × 2 = 100 simulations
```

### 3.3 Two Worlds to Compare

The project runs each population under **two topologies** for comparative analysis:

#### Erdős-Rényi (Random World)

```python
erdos_renyi = ErdosRenyiTopology(n=50, p=0.1)
```

**Characteristics:**
- Independent random connections
- Degree distribution: Poisson (homogeneous)
- Average degree: n × p = 50 × 0.1 = 5 friends
- No hubs or clear modular structure

**Hypothesis:**
- Behaviors spread uniformly
- Cooperators and selfish agents compete on equal structural ground
- More random, less predictable

#### Barabási-Albert (World with Influencers)

```python
barabasi = BarabasiAlbertTopology(n=50, m=2)
```

**Characteristics:**
- Growth + preferential attachment
- Degree distribution: power law (heterogeneous)
- Presence of hubs (highly connected nodes)
- Hierarchical structure

**Hypothesis:**
- Hubs dominate the evolutionary dynamics
- If hubs adopt cooperation → it spreads widely
- Heterogeneity in social influence
- Potentially more resilient (or more fragile)

---

With the complete model defined, let us now learn how to **use the tool**.

---

## 4. The Tool: From Concept to Code

### 4.1 Installation and First Run

#### Requirements

- Python 3.9 or higher
- Operating system: Windows, macOS, or Linux
- 4 GB of RAM (minimum)

#### Step 1: Clone the repository

```bash
git clone https://github.com/tu-usuario/cooperation-survival-prisoners-dilemma.git
cd cooperation-survival-prisoners-dilemma
```

#### Step 2: Install dependencies

```bash
pip install -r requirements.txt
```

**Main dependencies:**
- `numpy`: Numerical computation (Pareto distribution)
- `networkx`: Network generation and analysis
- `matplotlib`: Network visualization
- `pyyaml`: Configuration file reading

#### Step 3: Run with default configuration

```bash
python main.py
```

**Expected console output:**

```
================================================================================
MEGA-EXPERIMENT RUNNER
================================================================================
Configuration loaded from: config.yaml
Output directory: results/mega_20250109_143022

Experiment Settings:
  - Populations: 10
  - Simulations per topology: 5
  - Total simulations: 100

================================================================================
POPULATION 1/10: pop_a1b2c3d4
  Composition: 28 Altruistic, 22 Selfish (56.0% Altruistic)
================================================================================

  Running Erdős-Rényi simulations...
  [1/5] Simulation 1 completed in 2.3s (4 epochs, reason: Agent death detected)
  [2/5] Simulation 2 completed in 1.8s (3 epochs, reason: Agent death detected)
  [3/5] Simulation 3 completed in 5.2s (8 epochs, reason: Agent death detected)
  [4/5] Simulation 4 completed in 3.1s (5 epochs, reason: Agent death detected)
  [5/5] Simulation 5 completed in 2.7s (4 epochs, reason: Agent death detected)

  Running Barabási-Albert simulations...
  [1/5] Simulation 1 completed in 3.4s (6 epochs, reason: Agent death detected)
  [2/5] Simulation 2 completed in 4.1s (7 epochs, reason: Agent death detected)
  ...

[Completes all 100 simulations]

================================================================================
MEGA-EXPERIMENT COMPLETE
================================================================================
Total duration: 245.3 seconds
Results saved to: results/mega_20250109_143022/

NEXT STEPS:
  1. Read the generated README: results/mega_20250109_143022/README.md
  2. Explore visualizations: results/mega_20250109_143022/key_visualizations/
  3. Analyze data: results/mega_20250109_143022/mega_analysis.json
```

#### Step 4: Explore results

```bash
# Navigate to the results folder
cd results/mega_20250109_143022/

# Open the automatically generated README
open README.md  # macOS
xdg-open README.md  # Linux
start README.md  # Windows

# The README contains:
# - Executive summary
# - Comparative analysis Erdős-Rényi vs Barabási-Albert
# - Results per population
# - Navigation instructions
```

Congratulations! You have run your first experiment.

### 4.2 Understanding the Results Structure

After running, the results folder looks like this:

```
results/mega_20250109_143022/
│
├── README.md                      # Executive summary (START HERE)
├── populations_index.json         # Index of all populations
├── mega_analysis.json             # Global comparative analysis
│
├── key_visualizations/            # Main charts
│   ├── epochs_comparison.png      # Erdős-Rényi vs Barabási-Albert
│   ├── cooperation_evolution.png  # Cooperation evolution
│   └── wealth_distribution.png    # Wealth distribution
│
└── populations/                   # Data for each population
    ├── pop_001/
    │   ├── population_info.json   # Initial composition
    │   │
    │   ├── erdos/                 # Erdős-Rényi results
    │   │   ├── sim_001/
    │   │   │   ├── results.json           # Complete data
    │   │   │   ├── agent_lifecycles.json  # Event history per agent
    │   │   │   └── visualizations/        # Network charts
    │   │   │       ├── epoch_000.png      # Initial network
    │   │   │       ├── epoch_010.png
    │   │   │       └── epoch_final.png    # State at termination
    │   │   ├── sim_002/
    │   │   └── ... (sim_003, sim_004, sim_005)
    │   │
    │   └── barabasi/              # Barabási-Albert results
    │       ├── sim_001/
    │       └── ... (sim_002-005)
    │
    ├── pop_002/
    └── ... (pop_003-010)
```

**Key files:**

1. **`README.md`** (automatically generated)
   - Results summary
   - Comparison between topologies
   - Navigation instructions

2. **`mega_analysis.json`** (global analysis)
   ```json
   {
     "erdos_renyi": {
       "num_simulations": 50,
       "mean_epochs": 5.4,
       "std_epochs": 2.1,
       "mean_final_agents": 49.2,
       "altruistic_survival_rate": 0.58
     },
     "barabasi_albert": {
       "num_simulations": 50,
       "mean_epochs": 6.8,
       "std_epochs": 2.6,
       "mean_final_agents": 49.5,
       "altruistic_survival_rate": 0.62
     },
     "comparison": {
       "winner": "Barabási-Albert",
       "epochs_difference": 1.4,
       "p_value": 0.032
     }
   }
   ```

3. **`results.json`** (per individual simulation)
   ```json
   {
     "simulation_id": "a1b2c3d4_erdos_1",
     "total_epochs": 5,
     "termination_reason": "Agent death detected (isolation or credit exhaustion)",
     "initial_agents": 50,
     "final_agents": 49,

     "deceased_history": [
       {
         "epoch": 5,
         "agent_id": 23,
         "death_reason": "isolation",
         "final_credits": 42,
         "strategy": [0.5, 0.5, 0.5, 0.5],
         "is_altruistic": true
       }
     ],

     "epochs": [
       {
         "epoch_number": 1,
         "active_agents": 50,
         "game_outcomes": {"wins": 120, "losses": 120, "ties": 15},
         "altruistic_agents": 28,
         "selfish_agents": 22
       },
       ...
     ]
   }
   ```

4. **`agent_lifecycles.json`** (detailed event history)
   ```json
   {
     "agents": {
       "23": {
         "birth_epoch": 0,
         "initial_strategy": [0.5, 0.5, 0.5, 0.5],
         "initial_credits": 42,

         "strategy_changes": [
           {
             "epoch": 3,
             "old_strategy": [0.5, 0.5, 0.5, 0.5],
             "new_strategy": [1.0, 0.0, 1.0, 0.0],
             "copied_from": 15,
             "reason": "rational_imitation",
             "params_copied": [0, 2]  // Only copied p and r
           }
         ],

         "death_epoch": 5,
         "death_reason": "isolation"
       }
     }
   }
   ```

### 4.3 Configuring Your First Custom Experiment

Now let us modify `config.yaml` for a quick test experiment:

```yaml
# config.yaml

# === POPULATION ===
population:
  num_agents: 30              # Fewer agents → faster
  probability_step: 0.5       # Keep 81 strategies

# === ECONOMY ===
economy:
  total_wealth: 5000          # Less total wealth
  pareto_alpha: 1.16
  min_credits: 1

  external_events:
    enable: false             # Disable for simplicity

# === EVOLUTION ===
strategy_evolution:
  enable: true
  epsilon_mutation: 0.001
  beta_fermi: 100.0
  enable_partial_copy: true   # Test novel contribution
  copy_thresholds: [1.25, 1.5, 2.0]

# === NETWORK DYNAMICS ===
network_dynamics:
  enable: true                # Enable to see effect

  edge_removal:
    enable: true
    defeat_threshold: 0.6
    epsilon_irrational: 0.01
    history_window: 5

  triadic_closure:
    enable: false             # Disable to isolate effect

  weak_ties:
    enable: false             # Disable to isolate effect

# === SIMULATION ===
simulation:
  max_epochs: 50              # Reduce for quick tests

# === TOPOLOGIES ===
erdos_renyi:
  probability: 0.15           # More connections → more interactions

barabasi_albert:
  m: 3                        # More connections per node

# === VISUALIZATION ===
visualization:
  save_visualizations: true
  epoch_interval: 5           # Save every 5 epochs

# === EXPERIMENT ===
mega_experiment:
  num_populations: 3          # Only 3 test populations
  simulations_per_topology: 2 # 2 instances each
  # Total: 3 × 2 × 2 = 12 simulations (~2-3 minutes)
```

Run:

```bash
python main.py
```

### 4.4 Practical Use Cases

#### Use Case 1: Compare Erdős-Rényi vs Barabási-Albert

**Question:** In which topology do agents survive longer?

**Configuration:**
```yaml
mega_experiment:
  num_populations: 5
  simulations_per_topology: 10  # More instances → greater statistical robustness
```

**Analysis:**
```bash
# After running, check:
cat results/mega_TIMESTAMP/mega_analysis.json

# Look for:
# - "mean_epochs": Which topology has more average epochs?
# - "p_value": Is it statistically significant? (p < 0.05)
```

**Interpretation:**
- If Barabási-Albert has more epochs → structure with hubs favors survival
- If Erdős-Rényi has more epochs → homogeneity favors survival

#### Use Case 2: Effect of Partial Copy vs Complete Copy

**Question:** Does partial copy generate greater diversity?

**Experiment A (partial copy):**
```yaml
strategy_evolution:
  enable_partial_copy: true
```

Run and save results:
```bash
python main.py
mv results/mega_TIMESTAMP results/experiment_partial
```

**Experiment B (complete copy):**
```yaml
strategy_evolution:
  enable_partial_copy: false  # Complete copy only
```

Run:
```bash
python main.py
mv results/mega_TIMESTAMP results/experiment_full
```

**Analysis:**
```python
# Comparison script:
import json

# Load results
with open('results/experiment_partial/mega_analysis.json') as f:
    partial = json.load(f)

with open('results/experiment_full/mega_analysis.json') as f:
    full = json.load(f)

# Compare strategic diversity
print(f"Diversity (partial): {partial['strategy_diversity']}")
print(f"Diversity (complete): {full['strategy_diversity']}")
```

#### Use Case 3: Impact of Network Dynamics

**Question:** Does edge removal affect survival?

**Experiment A (without dynamics):**
```yaml
network_dynamics:
  enable: false  # Static network
```

**Experiment B (with edge removal):**
```yaml
network_dynamics:
  enable: true
  edge_removal:
    enable: true
  triadic_closure:
    enable: false
  weak_ties:
    enable: false
```

**Analysis:** Compare `mean_epochs` between both experiments.

#### Use Case 4: Complete Experiment for Publication

**Robust configuration:**

```yaml
population:
  num_agents: 100              # Large population
  probability_step: 0.25       # 625 strategies (high diversity)

simulation:
  max_epochs: 300              # Allow long evolution

mega_experiment:
  num_populations: 20          # Many populations
  simulations_per_topology: 10 # High replication
  # Total: 20 × 10 × 2 = 400 simulations

visualization:
  save_visualizations: true
  epoch_interval: 20           # Less frequent (space saving)
```

#### Use Case 5: Impact of Irrational Rejection

**Research question:** How do irrational interaction interruptions affect network survival?

**Hypothesis:** Higher rejection rate → fewer cooperation opportunities → earlier network death.

**Experimental design:**

Compare three scenarios with fixed topology (Barabási-Albert, m=3) and constant population:

```yaml
# Scenario A: No rejection (control)
network_dynamics:
  interaction_refusal:
    enable: false

# Scenario B: Low rejection (0.5%)
network_dynamics:
  interaction_refusal:
    enable: true
    epsilon_refuse: 0.005  # 0.5% prob per neighbor

# Scenario C: Moderate rejection (2%)
network_dynamics:
  interaction_refusal:
    enable: true
    epsilon_refuse: 0.02   # 2% prob per neighbor

# Scenario D: High rejection (5%)
network_dynamics:
  interaction_refusal:
    enable: true
    epsilon_refuse: 0.05   # 5% prob per neighbor
```

**Metrics to compare:**
- Time until first death (survival epochs)
- Average number of interactions per epoch (should decrease with higher `epsilon_refuse`)
- Credit dispersion at time of death
- Dominant strategies at the end

**Expected result:**
- Scenario A (no rejection) survives more epochs
- Scenario D (high rejection) collapses quickly
- Inverse relationship between `epsilon_refuse` and survival

---

## 5. Software Architecture

This section briefly describes the code organization. It is not necessary to understand it completely to **use** the tool, but it is necessary to **extend** or **modify** it.

### 5.1 Main Modules

```
cooperation-survival-prisoners-dilemma/
│
├── core_simulation/              # Strategies and evolution
│   ├── strategy.py               # Strategy class (memory-one)
│   ├── strategy_evolution.py    # Fermi Rule + partial copy
│   └── strategy_generator.py    # S(p,q,r,s) space generator
│
├── network_topologies/           # Network generators
│   ├── base_topology.py          # Abstract base class
│   ├── erdos_renyi.py            # Random network
│   └── barabasi_albert.py        # Scale-free network
│
├── network_dynamics/             # Adaptation mechanisms
│   ├── interaction_history.py    # Game history
│   └── edge_manager.py           # Removal, triadic, weak ties
│
├── network_simulation/           # Main engine
│   └── network_game.py           # Complete orchestration
│
├── supporting_infrastructure/    # Utilities
│   ├── payoff_matrix.py          # Payoff matrix
│   ├── wealth_distribution.py    # Pareto distribution
│   ├── population_generator.py   # Population generation
│   ├── config_loader.py          # Configuration loading
│   ├── agent_tracker.py          # Agent event history
│   ├── mega_experiment_runner.py # Orchestrator
│   └── readme_generator.py       # README generation
│
└── visualization/                # Visualization
    ├── network_visualizer.py     # Network charts
    └── comparative_analyzer.py   # Comparative analysis
```

### 5.2 Simplified Data Flow

```
INPUT: config.yaml
    ↓
MegaExperimentRunner.run()
    ↓
For each population:
    ↓
    Generate strategies + credits (Pareto)
    ↓
    For each topology (Erdős-Rényi, Barabási-Albert):
        ↓
        Create M instances with different seeds
        ↓
        NetworkGameV2.run_simulation():
            ↓
            Epoch loop:
                ├─ Games (Strategy.play_game)
                ├─ Update credits (±1)
                ├─ Process deaths
                ├─ Evolution (Fermi Rule)
                ├─ Network dynamics (EdgeManager)
                └─ Save visualization
            ↓
            Terminate if death or max_epochs
    ↓
Comparative analysis
    ↓
OUTPUT: results/mega_TIMESTAMP/
```

### 5.3 How to Extend the Tool

#### Adding a New Topology

**Step 1:** Create a new class in `network_topologies/`:

```python
# network_topologies/small_world.py

from network_topologies.base_topology import BaseTopology
import networkx as nx

class SmallWorldTopology(BaseTopology):
    def __init__(self, n: int, k: int, p: float):
        """
        Small-world network (Watts-Strogatz).

        Args:
            n: Number of nodes
            k: Initial degree (each node connected to k neighbors)
            p: Rewiring probability
        """
        super().__init__(num_nodes=n)
        self.k = k
        self.p = p

    def generate_network(self):
        """Generate network using NetworkX."""
        self.graph = nx.watts_strogatz_graph(
            n=self.num_nodes,
            k=self.k,
            p=self.p
        )
        return self.graph
```

**Step 2:** Register in configuration:

```yaml
# config.yaml

small_world:
  k: 4   # Initial degree
  p: 0.1 # Rewiring probability
```

**Step 3:** Use in experiment:

```python
# main.py or custom script

from network_topologies.small_world import SmallWorldTopology

topology = SmallWorldTopology(n=50, k=4, p=0.1)
# Rest of the code stays the same...
```


---

## 6. Limitations and Possible Extensions

### 6.1 Model Assumptions

| Assumption | Reality | Impact |
|------------|---------|--------|
| Memory-one strategies | Humans have longer memory | Reasonable simplification for analysis |
| Perfect information | In reality there is imperfect information | Partially modeled with noise (ε) |
| Pairwise interactions | Group interactions may exist | Possible future extension |
| Symmetric payoffs | Context can affect payoffs | Payoff matrix is configurable |
| Closed population | Births/immigration are possible | Focus on fixed population dynamics |

### 6.2 Conceptual Limitations

1. **Strategy space:**
   - Limited to memory-one (4 parameters)
   - Does not explore strategies with longer memory

2. **Network dynamics:**
   - Four mechanisms implemented: edge removal, triadic closure, weak ties, and irrational rejection
   - Many other possible mechanisms (community, homophily, temporal preference, etc.)

3. **Economy:**
   - Does not model production, trade, inheritance
   - Focused only on redistribution through competition

### 6.3 Possible Extensions

This project establishes solid foundations that can be extended by interested researchers. The modular design facilitates incorporating new functionality without major modifications.

**Possible directions:**

1. **Network topologies:**
   - Small-world (Watts-Strogatz)
   - Modular networks (predefined communities)
   - Spatial lattices
   - Temporal networks (dynamically changing connections)

2. **Strategy space:**
   - Memory-two or memory-k (longer memory)
   - Reinforcement learning
   - More complex conditional strategies

3. **Economic mechanisms:**
   - Multiple types of resources
   - Production, trade, and exchange
   - Birth and death dynamics
   - Wealth inheritance between generations

4. **Analysis and visualization:**
   - Automated statistical tests
   - Emergent pattern detection
   - Interactive visualizations
   - Comparison with empirical data

The modular architecture of the code (see Section 5) allows adding these components as independent extensions.

---

## 7. References

Axelrod, R. (1984). The Evolution of Cooperation.

Barabási, A. L., & Albert, R. (1999). Emergence of scaling in random networks.

Erdős, P., & Rényi, A. (1960). On the evolution of random graphs.

Granovetter, M. S. (1973). The strength of weak ties.

Nowak, M. A. (2006). Evolutionary Dynamics: Exploring the Equations of Life.

Nowak, M. A., & May, R. M. (1992). Evolutionary games and spatial chaos.

Nowak, M. A., & Sigmund, K. (1998). Evolution of indirect reciprocity by image scoring.

Perc, M., & Szolnoki, A. (2010). Coevolutionary games—a mini review.

Press, W. H., & Dyson, F. J. (2012). Iterated Prisoner's Dilemma contains strategies that dominate any evolutionary opponent.

Rapoport, A., & Chammah, A. M. (1965). Prisoner's Dilemma: A Study in Conflict and Cooperation.

Santos, F. C., & Pacheco, J. M. (2005). Scale-free networks provide a unifying framework for the emergence of cooperation.

Szabó, G., & Fáth, G. (2007). Evolutionary games on graphs.

Traulsen, A., Nowak, M. A., & Pacheco, J. M. (2006). Stochastic dynamics of invasion and fixation.

Watts, D. J., & Strogatz, S. H. (1998). Collective dynamics of 'small-world' networks.

Miękisz, J., et al. (2024). Phase transitions in the Prisoner's Dilemma game on the Barabási–Albert graph with participation cost.

Zimmermann, M. G., & Eguíluz, V. M. (2005). Cooperation, social networks, and the emergence of leadership in a prisoner's dilemma with adaptive local interactions.

---

## 8. Appendices

### Appendix A: Glossary of Terms

| Term | Definition |
|------|------------|
| **Agent** | Simulated entity that makes decisions (plays, learns, interacts) |
| **Altruist** | Strategy with sum of probabilities > 2.0 (tendency to cooperate) |
| **Edge** | Connection between two agents (social relationship) |
| **Clustering** | Measure of how connected the neighbors of a node are among themselves |
| **Partial copy** | Mechanism where only some parameters are copied based on relative wealth |
| **Cooperate** | Action of helping the opponent in the Prisoner's Dilemma |
| **Defect** | Selfish action of maximizing one's own benefit |
| **Epsilon (ε)** | Irrationality/noise parameter in decisions |
| **Epoch** | Complete cycle of games, evolution, and network dynamics |
| **Fitness** | Measure of success (in this model: accumulated credits) |
| **Degree** | Number of connections a node has |
| **Hub** | Node with very high degree (highly connected) |
| **Misfortune** | Random event that reduces an agent's credits |
| **Memory-one** | Strategy that only remembers the result of the previous turn |
| **Irrational mutation** | Copying a neighbor's strategy without evaluating if it is better (exploration) |
| **Node** | Agent in the network representation (graph) |
| **Pareto** | Statistical distribution that models inequality (power law) |
| **Irrational rejection** | Refusing to play with a neighbor without evaluating performance (temporary) |
| **Fermi Rule** | Probabilistic function for imitation based on fitness difference |
| **Rational removal** | Removing an edge after evaluating that it is not beneficial (permanent) |
| **Topology** | Connection structure of the network (who is connected to whom) |
| **Trembling hand** | Execution error where a different action is performed than intended |
