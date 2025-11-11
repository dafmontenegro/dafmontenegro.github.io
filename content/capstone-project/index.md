---
title: "Prisoner's Dilemma in Dynamic Network Topologies: Agent-Based Simulation Framework"
description: "Computational tool for studying cooperation and isolation dynamics in adaptive social networks through game theory. Integrates cultural evolution via Fermi Rule imitation, dynamic network rewiring, wealth inequality modeling, and agent survival mechanisms to explore how cooperation emerges in complex systems."
summary: "An agent-based simulation framework that explores the Prisoner's Dilemma on dynamic networks. Agents learn by imitating successful neighbors (Fermi Rule), adapt network connections, and face survival challenges based on economic success. Integrates memory-one strategies, wealth distribution, and network topology evolution to study cooperation emergence."
date: 2024-05-21
lastmod: 2025-11-11
showDate: false
showDateUpdated: false
showReadingTime: false
featureAlt: "Network topology illustration for Prisoner's Dilemma simulation"
coverAlt: "Network topology illustration for Prisoner's Dilemma simulation"
coverCaption: "Basic network topology visualization illustrating agent connections"
thumbnailAlt: "Network topology illustration"
categories: ["research", "software"]
tags: ["prisoners-dilemma", "game-theory", "agent-based-modeling", "network-dynamics", "cooperation", "cultural-evolution", "fermi-rule", "complex-systems", "simulation", "undergraduate-thesis"]
---

# Análisis del Dilema del Prisionero en Topologías de Redes Dinámicas: Desarrollo de Herramienta Computacional para el Estudio de Cooperación y Aislamiento de Agentes

**Autor:** Daniel Felipe Montenegro Herrera

**Director:** Juan David García Arteaga

**Universidad Nacional de Colombia**

**Ingeniería de Sistemas y Computación**

---

## 0. ¿De qué trata este proyecto?

Imagina un grupo de personas que deben decidir constantemente entre cooperar o actuar egoístamente. ¿Cuándo sobrevive la cooperación? ¿Cuándo domina el egoísmo? ¿Cómo influye la estructura de la red social? ¿Qué pasa cuando las personas pueden romper relaciones tóxicas y formar nuevas amistades?

Este proyecto es una herramienta computacional que simula estas dinámicas sociales usando el famoso **Dilema del Prisionero** en **redes dinámicas**. Permite estudiar cómo evoluciona la cooperación cuando:
- Las personas aprenden imitando a sus vecinos exitosos
- Las redes sociales se adaptan (se rompen y forman conexiones)
- La riqueza está desigualmente distribuida
- La supervivencia depende del éxito económico

**Para quién es este documento:**
- Estudiantes e investigadores interesados en cooperación y comportamiento social
- Personas con formación universitaria básica (NO se requiere experiencia previa en teoría de juegos)
- Cualquiera que pueda ejecutar programas Python básicos

---

## 1. Introducción: El Problema de la Cooperación

### 1.1 ¿Por qué es difícil cooperar?

En nuestra vida cotidiana enfrentamos constantemente situaciones donde debemos decidir entre:
- **Cooperar:** Ayudar a otros, aunque nos cueste algo
- **Desertar:** Actuar egoístamente, maximizando nuestro beneficio inmediato

Ejemplos concretos:
- En un proyecto grupal: ¿trabajar duro (cooperar) o dejar que otros hagan el trabajo (desertar)?
- En el tráfico: ¿dejar pasar a alguien (cooperar) o acelerar para ganar unos segundos (desertar)?
- En el uso de recursos compartidos: ¿usar lo necesario (cooperar) o abusar (desertar)?

El dilema surge porque:
1. **Si todos cooperan**, todos ganan
2. **Si todos desertan**, todos pierden
3. **Pero si YO deserto mientras TÚ cooperas**, yo gano más (y tú pierdes más)

Esta última opción crea la tentación de desertar. Si cada persona razona así, terminamos en un mundo donde nadie coopera y todos pierden. Sin embargo, **en la vida real la cooperación existe y prospera**. ¿Cómo es posible?

### 1.2 La ciencia de la cooperación

Este problema ha fascinado a científicos durante décadas. Algunas preguntas clave:

1. **¿Bajo qué condiciones emerge la cooperación?**
   - ¿Importa si las interacciones se repiten?
   - ¿Importa quién interactúa con quién?
   - ¿Importa cómo aprenden las personas?

2. **¿Cómo sobrevive la cooperación frente al egoísmo?**
   - ¿Los cooperadores pueden protegerse mutuamente?
   - ¿Las redes sociales favorecen algún comportamiento?

3. **¿Qué pasa cuando las redes sociales son dinámicas?**
   - Si puedes "desconectarte" de personas egoístas, ¿cambia todo?
   - ¿La formación de nuevas amistades promueve cooperación?

Este proyecto proporciona una herramienta para explorar sistemáticamente estas preguntas.

### 1.3 Qué hace diferente este proyecto

Estudios previos del Dilema del Prisionero generalmente:
- Usan redes **estáticas** (las conexiones nunca cambian)
- No modelan desigualdad económica inicial
- Usan reglas de evolución simplificadas

**Este framework integra:**

- **Redes dinámicas:** Los agentes pueden romper conexiones desfavorables y formar nuevas

- **Economía realista:** Distribución desigual de riqueza inicial (como en la vida real)

- **Evolución cultural:** Los agentes aprenden imitando a vecinos exitosos (Regla de Fermi)

Ahora que entendemos **por qué** estudiamos esto, construyamos los conceptos teóricos necesarios desde cero.

---

## 2. Fundamentos: Construyendo desde Cero

Esta sección introduce todos los conceptos teóricos necesarios, explicados gradualmente. Si ya conoces teoría de juegos, puedes saltar directamente a la [Sección 3](#3-el-modelo-integrando-los-conceptos).

### 2.1 Teoría de Juegos: La ciencia de las decisiones estratégicas

**Teoría de juegos** es el estudio matemático de situaciones donde el resultado de nuestras decisiones depende de las decisiones de otros.

**Ejemplo simple (no estratégico):**
- Si decido usar paraguas, el resultado depende **solo del clima** (no de otras personas)
- Esto NO es un juego en el sentido de teoría de juegos

**Ejemplo estratégico (es un juego):**
- Si decido poner un negocio, el resultado depende de **si otros también ponen negocios** en la zona
- Si muchos ponen negocios → competencia → menos ganancias para todos
- Si pocos ponen negocios → monopolio → altas ganancias
- Esto SÍ es un juego: mi resultado depende de decisiones ajenas

**Elementos de un juego:**
1. **Jugadores:** Quiénes toman decisiones (en nuestro caso: agentes simulados)
2. **Acciones:** Qué pueden hacer (cooperar o desertar)
3. **Pagos:** Qué ganan o pierden según las acciones de todos
4. **Información:** Qué saben al decidir

La teoría de juegos nos ayuda a entender qué estrategias son racionales en diferentes situaciones.

### 2.2 El Dilema del Prisionero: El juego más famoso

#### La historia original

Dos sospechosos son arrestados. La policía los separa y les hace la misma oferta a cada uno:

- **Si ambos callan** (cooperan entre sí): 1 año de cárcel cada uno
- **Si ambos confiesan** (desertan): 3 años de cárcel cada uno
- **Si uno confiesa y el otro calla**: El confesar sale libre, el que calló recibe 5 años

**¿Qué harías tú?**

Razonamiento de cada prisionero:
- "Si mi cómplice calla, me conviene confesar (0 años vs 1 año)"
- "Si mi cómplice confiesa, me conviene confesar (3 años vs 5 años)"
- "En ambos casos, me conviene confesar"

Resultado: **Ambos confiesan y reciben 3 años**, cuando hubieran estado mejor callando (1 año cada uno).

#### Generalización: La matriz de pagos

Podemos representar cualquier dilema similar con una matriz de pagos:

```
                     Jugador 2
                Cooperar    Desertar
              ┌─────────────────────┐
              │  R, R    │  S, T    │  Cooperar
   Jugador 1  ├─────────────────────┤
              │  T, S    │  P, P    │  Desertar
              └─────────────────────┘
```

**Valores clásicos de Axelrod (usados en este proyecto):**
- **R (Reward):** 3 puntos si ambos cooperan
- **T (Temptation):** 5 puntos si deserto y el otro coopera
- **S (Sucker):** 0 puntos si coopero y el otro deserta
- **P (Punishment):** 1 punto si ambos desertamos

**Relación crucial:** T > R > P > S  (5 > 3 > 1 > 0)

Esto define el dilema:
- **T > R:** Tengo tentación de desertar incluso si el otro coopera
- **R > P:** Pero estaríamos mejor si ambos cooperáramos
- **P > S:** Y si el otro deserta, mejor desertar también

```python
# Así se define en el código:

DEFAULT_PAYOFF_MATRIX = PayoffMatrix(
    reward=3,      # Ambos cooperan
    temptation=5,  # Yo deserto, tú cooperas
    sucker=0,      # Yo coopero, tú desertas
    punishment=1   # Ambos desertamos
)
```

**Pregunta clave:** Si el dilema se juega **una sola vez**, la estrategia racional es desertar. Pero, ¿qué pasa si se juega **muchas veces**?

### 2.3 Iteración: Cuando el juego se repite

Imagina que no juegas una vez, sino **cientos de veces** con las mismas personas. Ahora:

- Puedes **castigar** a quien te traicionó (desertando contra ellos después)
- Puedes **recompensar** a quien cooperó (cooperando de vuelta)
- Tu **reputación** importa: si desertas siempre, nadie cooperará contigo

Esto cambia completamente el juego. Ahora estrategias cooperativas pueden prosperar.

#### Ejemplo: Tit-for-Tat ("ojo por ojo")

Una de las estrategias más famosas es **Tit-for-Tat** que en español puede entenderse popularmente como "ojo por ojo":

**Regla simple:**
1. En la primera ronda: **coopera**
2. En rondas siguientes: **haz lo que el otro hizo la ronda anterior**

Si el otro coopera → tú cooperas

Si el otro deserta → tú desertas (castigo)

Si luego coopera de nuevo → tú perdonas y cooperas

**¿Por qué funciona bien?**
- Es "amable" (nunca deserta primero)
- Es "vengativa" (castiga inmediatamente la deserción)
- Es "perdonadora" (vuelve a cooperar si el otro lo hace)
- Es "clara" (fácil de entender para otros jugadores)

_En torneos famosos de Robert Axelrod (1980), Tit-for-Tat ganó consistentemente contra estrategias más complejas._

**En este proyecto**, simulamos exactamente este tipo de interacciones iteradas, donde cada par de agentes juega múltiples rondas (normalmente un numero aleatorio de rondas definido entre un rango discreto razonable).

#### Trembling Hand: Errores en la ejecución

Hasta ahora hemos asumido que los agentes ejecutan perfectamente sus estrategias. Pero en la realidad, **las personas cometen errores**:
- Un cooperador puede accidentalmente desertar por malentendido
- Un desertor puede cooperar por error de comunicación
- Fatiga, distracción o información imperfecta causan desviaciones involuntarias

Este fenómeno se conoce en teoría de juegos como **"trembling hand"** (mano temblorosa), introducido por Reinhard Selten (Premio Nobel 1994).

**Concepto:** Con una pequeña probabilidad, un agente ejecuta una acción **diferente** a la que su estrategia dicta.

**Ejemplo numérico:**

```python
# Mi estrategia dice: COOPERAR en esta ronda
my_intended_action = "cooperate"

# Pero con probabilidad noise_probability, "tiemblo" y hago lo opuesto
if random() < noise_probability:  # Típicamente 0.001 (0.1%)
    my_actual_action = "defect"   # Error de ejecución
    reason = "trembling_hand"
else:
    my_actual_action = "cooperate"  # Ejecución correcta
```

**Interpretación con noise_probability = 0.001:**
- En 999 de cada 1000 rondas → ejecuto correctamente mi estrategia
- En 1 de cada 1000 rondas → "tiemblo" y ejecuto lo contrario

**¿Por qué modelar errores de ejecución?**

1. **Realismo:** Las interacciones humanas nunca son perfectas
2. **Robustez:** Estrategias que funcionan bajo errores son más realistas
3. **Perdón:** Permite que cooperadores perdonen errores accidentales
4. **Diversidad:** Previene convergencia total a un solo comportamiento

**Nota:** El trembling hand es uno de varios mecanismos de ruido/irracionalidad en este modelo. Otros mecanismos (que veremos en Sección 2.5) afectan el **aprendizaje** de estrategias, mientras que el trembling hand afecta la **ejecución** de acciones.

**Efecto en interacciones iteradas:**

Con trembling hand, incluso estrategias deterministas como Tit-for-Tat se vuelven ligeramente estocásticas:
- Un Tit-for-Tat puro coopera siempre con otro Tit-for-Tat
- Con trembling hand (0.1%), ocasionalmente desertan por error
- Esto puede iniciar ciclos de castigo-perdón
- Estrategias "perdonadoras" se vuelven evolutivamente ventajosas

**Configuración:**

```yaml
simulation:
  noise_probability: 0.001  # 0.1% de error en cada decisión
```

Valores típicos:
- `0.0` → Ejecución perfecta (poco realista)
- `0.001` (0.1%) → Errores raros pero presentes (estándar)
- `0.01` (1%) → Errores frecuentes (mucho ruido)

### 2.4 Estrategias Memory-One: Simplicidad con poder

¿Qué pasa si en lugar de recordar **toda la historia** de interacciones, solo recuerdas **el resultado inmediatamente anterior**? Esta es la idea detrás de las estrategias **memory-one** (memoria de orden uno).

#### La representación S(p, q, r, s)

Una estrategia memory-one se define por **cuatro probabilidades**:

- **p:** Probabilidad de cooperar después de que ambos cooperaron (CC)
- **q:** Probabilidad de cooperar después de que yo cooperé y el otro desertó (CD)
- **r:** Probabilidad de cooperar después de que yo deserté y el otro cooperó (DC)
- **s:** Probabilidad de cooperar después de que ambos desertaron (DD)

**Ejemplo: Tit-for-Tat en notación memory-one**

```
S(p=1.0, q=0.0, r=1.0, s=0.0)
```

¿Por qué?
- Después de CC → coopera con probabilidad 1.0 (p=1.0)
- Después de CD → deserta con certeza (q=0.0) ← castigo
- Después de DC → coopera con probabilidad 1.0 (r=1.0) ← perdón
- Después de DD → deserta con certeza (s=0.0)

**Otras estrategias clásicas:**

```python
# Always Cooperate (Siempre Coopera): Coopera sin importar qué
always_coop = Strategy(p=1.0, q=1.0, r=1.0, s=1.0)

# Always Defect (Siempre Deserta): Nunca coopera
always_defect = Strategy(p=0.0, q=0.0, r=0.0, s=0.0)

# Win-Stay-Lose-Shift (Gano-Mantengo, Pierdo-Cambio):
# Si me fue bien, repito; si me fue mal, cambio
wsls = Strategy(p=1.0, q=0.0, r=0.0, s=1.0)

# Generous Tit-for-Tat (Tit-for-Tat Generoso):
# Como TFT, pero a veces perdona incluso si el otro desertó
gtft = Strategy(p=1.0, q=0.1, r=1.0, s=0.1)
```

#### El espacio de estrategias

Con cuatro parámetros que pueden tomar valores entre 0.0 y 1.0, existen **infinitas** estrategias memory-one posibles.

En este proyecto, discretizamos el espacio usando un "paso" configurable:

```yaml
# Configuración típica
population:
  probability_step: 0.5  # Permite valores: 0.0, 0.5, 1.0

# Esto genera: 3^4 = 81 estrategias posibles
# Ejemplos: (0.0, 0.0, 0.0, 0.0), (0.0, 0.0, 0.0, 0.5), ..., (1.0, 1.0, 1.0, 1.0)
```

Con paso más fino (0.25), tendríamos 5^4 = 625 estrategias. Con paso 0.1, tendríamos 11^4 = 14,641 estrategias.

#### Clasificación: Altruistas vs Egoístas

Para simplificar el análisis, clasificamos cada estrategia como:

```python
cooperation_sum = p + q + r + s

if cooperation_sum >= 2.0:
    agent_type = "Altruist"     # Tendency to cooperate
else:
    agent_type = "Selfish"      # Tendency to defect
```

**Ejemplos:**
- Always Cooperate: suma = 4.0 → Altruista
- Tit-for-Tat: suma = 2.0 → **Altruista** (incluido en altruistas)
- Always Defect: suma = 0.0 → Egoísta

Esta clasificación es simplificada pero útil para análisis rápido de composición poblacional.

Ahora que entendemos qué son las estrategias, surge una pregunta natural: **¿Cómo deciden los agentes cambiar su estrategia?** Aquí es donde entra la evolución cultural.

### 2.5 Evolución Cultural: Aprendiendo de los vecinos exitosos

En la vida real, las personas aprenden observando a otros. Si ves que tu vecino tiene éxito haciendo algo, podrías imitarlo. Este es el principio de **imitación basada en éxito**.

#### La Regla de Fermi: Imitación probabilística

La **Regla de Fermi** modela este proceso de forma realista:

**Pregunta:** ¿Con qué probabilidad un agente A imita al agente B?

**Respuesta:**

```
P(A imita B) = 1 / (1 + exp(β × (fitness_A - fitness_B)))
```

Donde:
- **fitness_A, fitness_B:** Riqueza o puntos acumulados de cada agente
- **β (beta):** Intensidad de selección (típicamente β=100)

**Interpretación:**

| Situación | Exponente | Probabilidad de imitar |
|-----------|-----------|------------------------|
| B mucho más rico que A | Negativo grande | ~1.0 (casi seguro) |
| B ligeramente más rico | Negativo pequeño | ~0.6-0.7 (probable) |
| Iguales | Cero | 0.5 (azar) |
| A ligeramente más rico | Positivo pequeño | ~0.3-0.4 (poco probable) |
| A mucho más rico | Positivo grande | ~0.0 (casi imposible) |

**Ejemplo numérico paso a paso** (β=100):

```python
# Caso 1: B es significativamente más exitoso que A
fitness_A = 100 créditos
fitness_B = 110 créditos
fitness_diff = fitness_A - fitness_B = 100 - 110 = -10

fermi_prob = 1 / (1 + exp(β × fitness_diff))
           = 1 / (1 + exp(100 × (-10)))
           = 1 / (1 + exp(-1000))
           = 1 / (1 + 0.0000...0)     # exp(-1000) ≈ 0
           ≈ 1.0                       # ¡A imita a B con ~100% de probabilidad!

# Caso 2: B es ligeramente más exitoso que A
fitness_A = 100 créditos
fitness_B = 101 créditos
fitness_diff = fitness_A - fitness_B = 100 - 101 = -1

fermi_prob = 1 / (1 + exp(100 × (-1)))
           = 1 / (1 + exp(-100))
           = 1 / (1 + 3.72×10⁻⁴⁴)     # exp(-100) ≈ 0
           ≈ 0.999...                  # Casi 100% de probabilidad

# Caso 3: Igual fitness (empate)
fitness_A = 100 créditos
fitness_B = 100 créditos
fitness_diff = fitness_A - fitness_B = 100 - 100 = 0

fermi_prob = 1 / (1 + exp(100 × 0))
           = 1 / (1 + exp(0))
           = 1 / (1 + 1)
           = 0.5                       # 50% de probabilidad (azar)

# Caso 4: A es ligeramente más exitoso que B
fitness_A = 101 créditos
fitness_B = 100 créditos
fitness_diff = fitness_A - fitness_B = 101 - 100 = 1

fermi_prob = 1 / (1 + exp(100 × 1))
           = 1 / (1 + exp(100))
           = 1 / (1 + 2.69×10⁴³)       # exp(100) es enorme
           ≈ 0.000...                  # Casi 0% de probabilidad

# Caso 5: A es mucho más exitoso que B
fitness_A = 110 créditos
fitness_B = 100 créditos
fitness_diff = fitness_A - fitness_B = 110 - 100 = 10

fermi_prob = 1 / (1 + exp(100 × 10))
           = 1 / (1 + exp(1000))
           = 1 / (1 + ∞)               # exp(1000) es astronómicamente grande
           ≈ 0.0                       # Esencialmente imposible
```

**Conclusión intuitiva:**
- Si B gana **más** que A → A probablemente imita a B
- Si ambos ganan **igual** → A imita a B con 50% de probabilidad
- Si A gana **más** que B → A probablemente NO imita a B

Con β=100, incluso diferencias pequeñas (1 crédito) se amplifican enormemente, haciendo que la imitación sea casi determinista hacia el más exitoso.

**¿Por qué usar Fermi en lugar de "copiar al más exitoso"?**

1. **Realismo:** Las personas no siempre copian perfectamente al más exitoso. Hay errores, dudas, información imperfecta.
2. **Exploración:** Permite que estrategias ligeramente peores sobrevivan y potencialmente prosperen después.
3. **Gradualismo:** Cambios suaves en lugar de cambios bruscos.

#### Mutación Irracional: Exploración sin evaluación

En la realidad, las personas no siempre actúan racionalmente al aprender. A veces:
- Copian a alguien por impulso (sin evaluar si es mejor)
- Experimentan por curiosidad ("¿Y si pruebo esto?")
- Imitan por moda o presión social, no por eficacia

**Concepto:** Con una pequeña probabilidad, un agente **copia la estrategia de un vecino aleatorio** sin evaluar si es mejor o peor.

**Distinción crucial (dos mecanismos de aprendizaje):**

Este proyecto modela **dos capas** en la evolución de estrategias:

| Capa | Mecanismo | Parámetro | Evaluación | Propósito |
|------|-----------|-----------|------------|-----------|
| **1. Mutación irracional** | Copia ciega | `epsilon_mutation` | NO evalúa fitness | Exploración pura |
| **2. Imitación racional** | Regla de Fermi | `beta_fermi` | SÍ evalúa fitness | Explotación gradual |

**Implementación:**

```python
# Proceso de evolución (cada época, para cada agente):

# === CAPA 1: MUTACIÓN IRRACIONAL (epsilon_mutation) ===
# Exploración pura: copiar sin mirar el desempeño
if random() < epsilon_mutation:  # Típicamente 0.001 (0.1%)
    neighbor = select_random_neighbor()
    copy_strategy(neighbor)  # Copiar COMPLETA la estrategia sin evaluar
    reason = "irrational_mutation"

else:
    # === CAPA 2: IMITACIÓN RACIONAL (Regla de Fermi) ===
    # Explotación gradual: copiar basándose en éxito relativo
    neighbor = select_random_neighbor()

    # Evaluar diferencia de fitness
    fitness_diff = my_fitness - neighbor_fitness
    fermi_prob = 1.0 / (1.0 + exp(beta_fermi × fitness_diff))

    # Decisión probabilística basada en éxito
    if random() < fermi_prob:
        copy_strategy(neighbor)
        reason = "rational_fermi_imitation"
    else:
        # Mantener estrategia actual (vecino no suficientemente mejor)
        reason = "keep_current_strategy"
```

**Parámetro epsilon_mutation:**

```yaml
strategy_evolution:
  epsilon_mutation: 0.001  # 0.1% de mutación irracional
```

Valores típicos:
- `0.0` → Cero exploración (riesgo de convergencia prematura)
- `0.001` (0.1%) → Exploración mínima pero presente (estándar)
- `0.01` (1%) → Exploración frecuente (alta diversidad)
- `0.1` (10%) → Exploración dominante (comportamiento errático)

**¿Por qué necesitamos mutación irracional?**

1. **Exploración del espacio de estrategias:** Sin ella, ciertas estrategias nunca serían descubiertas
2. **Escape de óptimos locales:** Permite salir de equilibrios subóptimos
3. **Diversidad poblacional:** Previene homogeneización completa
4. **Realismo:** Las personas experimentan y cometen errores

**Relación con otros mecanismos de ruido:**

Ya vimos en 2.3.1 el "trembling hand" (errores de ejecución). Ahora completamos el panorama:

| Mecanismo | Dónde ocurre | Parámetro | Ejemplo |
|-----------|--------------|-----------|---------|
| **Trembling hand** | Ejecución de acción | `noise_probability` | "Quise cooperar pero deserté" |
| **Mutación irracional** | Aprendizaje | `epsilon_mutation` | "Copié sin ver si funciona" |
| **Fermi (β finito)** | Evaluación | `beta_fermi` | "Copié aunque sea peor" |

Los tres mecanismos modelan aspectos diferentes del comportamiento humano imperfecto.

#### Copia Parcial de Estrategias: Aprendizaje gradual

Hasta ahora hemos asumido que cuando un agente decide imitar a otro (vía Fermi), **copia completamente** los 4 parámetros de su estrategia (p, q, r, s). Pero en la realidad, **el aprendizaje suele ser gradual**:
- Un estudiante no copia todo de su mentor, solo algunas técnicas
- Un comerciante adopta algunas prácticas de su competidor exitoso, no todas
- Una empresa imita ciertos aspectos de otra, manteniendo su identidad

**Pregunta motivadora:** ¿Por qué copiar todo si solo una parte de la estrategia del otro es responsable de su éxito?

**Concepto:** En lugar de copiar todo-o-nada, los agentes copian **parcialmente** según qué tan superior es el vecino. Cuanto mayor la diferencia de riqueza, más parámetros se copian.

**Lógica de umbrales:**

```python
# Calcular ratio de riqueza relativa
wealth_ratio = neighbor_credits / my_credits

# Determinar cuántos parámetros copiar según superioridad
if wealth_ratio >= 2.0:
    num_params = 4  # Copia completa
elif wealth_ratio >= 1.5:
    num_params = 3  # Copia casi todo
elif wealth_ratio >= 1.25:
    num_params = 2  # Copia parcial
else:
    num_params = 1  # Experimentación mínima
```

**Tabla de umbrales:**

| Ratio de riqueza | Parámetros copiados | Interpretación psicológica |
|------------------|---------------------|----------------------------|
| ≥ 2.0× (200%) | 4 (todos) | "¡Duplicó mi riqueza! Confío plenamente, copio todo" |
| ≥ 1.5× (150%) | 3 (aleatorios) | "Es bastante mejor, adopto casi toda su estrategia" |
| ≥ 1.25× (125%) | 2 (aleatorios) | "Es un poco mejor, pruebo parcialmente" |
| < 1.25× | 1 (aleatorio) | "Solo ligeramente mejor, experimento mínimamente" |

**Ejemplo numérico paso a paso:**

```python
# Situación inicial
my_strategy = S(p=0.5, q=0.5, r=0.0, s=1.0)     # Yo (estrategia A)
my_credits = 100

neighbor_strategy = S(p=1.0, q=1.0, r=0.5, s=0.0)  # Vecino (estrategia B)
neighbor_credits = 150

# Paso 1: Calcular ratio
wealth_ratio = 150 / 100 = 1.5

# Paso 2: Determinar número de parámetros (según tabla)
# ratio = 1.5 ≥ 1.5 → copiar 3 parámetros

# Paso 3: Seleccionar aleatoriamente 3 de los 4 parámetros
params_to_copy = random.sample(['p', 'q', 'r', 's'], 3)
# Supongamos que sale: ['p', 'r', 's']

# Paso 4: Copiar solo esos parámetros
my_new_strategy = S(
    p=1.0,   # Copiado de vecino
    q=0.5,   # Mantenido (no seleccionado)
    r=0.5,   # Copiado de vecino
    s=0.0    # Copiado de vecino
)
```

**Resultado:** Emergen **estrategias híbridas** que no existían previamente:
- Mi estrategia original: S(0.5, 0.5, 0.0, 1.0)
- Estrategia del vecino: S(1.0, 1.0, 0.5, 0.0)
- Mi nueva estrategia: S(1.0, 0.5, 0.5, 0.0) ← **Híbrido único**

**¿Por qué copia parcial es mejor que copia completa?**

1. **Gradualismo:** Cambios conductuales suaves en lugar de saltos abruptos
2. **Diversidad:** Genera nuevas estrategias por recombinación
3. **Exploración:** Búsqueda más amplia del espacio de estrategias
4. **Realismo:** Modela cómo las personas realmente aprenden (adaptación selectiva)
5. **Robustez:** No depende de que TODO en el vecino sea bueno

**Comparación: Copia completa vs copia parcial**

| Aspecto | Copia completa | Copia parcial |
|---------|----------------|---------------|
| Diversidad | Baja (solo estrategias iniciales) | Alta (nuevas combinaciones) |
| Velocidad | Convergencia rápida | Convergencia gradual |
| Adaptación | Todo-o-nada | Selectiva |
| Exploración | Limitada | Amplia |

**Configuración:**

```yaml
strategy_evolution:
  enable_partial_copy: true                  # Activar mecanismo
  copy_thresholds: [1.25, 1.5, 2.0]          # Umbrales de ratio
  irrational_partial_prob: 0.05              # Prob de copia parcial irracional
```

Parámetros:
- `enable_partial_copy: false` → Copia completa clásica (4 parámetros siempre)
- `enable_partial_copy: true` → Copia gradual según riqueza relativa
- `copy_thresholds` → Umbrales de ratio para 2, 3, 4 parámetros
- `irrational_partial_prob` → Probabilidad de hacer copia parcial incluso con epsilon_mutation

**Experimentos sugeridos:**

Para validar empíricamente el efecto de copia parcial, ver Caso de Uso 2 (Sección 4.4) que compara:
- Copia parcial vs copia completa
- Efecto en diversidad de estrategias emergentes
- Efecto en tiempo de supervivencia de la población

Ahora que entendemos cómo evolucionan las estrategias, necesitamos entender **dónde** ocurren estas interacciones. Las personas no interactúan con todo el mundo, sino con su **red social**.

### 2.6 Redes Sociales: ¿Con quién juegas?

En modelos clásicos, todos juegan contra todos ("población bien mezclada"). Pero en la vida real:
- Solo interactúas con un subconjunto de la población (tu red social)
- Tu red tiene estructura (amigos, amigos de amigos, etc.)
- La estructura afecta dramáticamente los resultados

#### Conceptos básicos de redes

Una **red** (o grafo) consiste en:
- **Nodos:** Agentes individuales (personas simuladas)
- **Aristas:** Conexiones entre agentes (quién interactúa con quién)

**Ejemplo visual:**
```
    A━━━B━━━C
    ┃   ┃   ┃
    D━━━E━━━F
```

En esta red:
- Hay 6 agentes (A, B, C, D, E, F)
- El agente **B** está conectado con: A, C, E (tiene 3 vecinos)
- El agente **E** está conectado con: B, D, F (tiene 3 vecinos)
- Cuando B juega el dilema del prisionero, solo juega contra sus vecinos: A, C y E
- Cuando B puede imitar a alguien, solo puede imitar a uno de sus vecinos: A, C o E

**Grado de un nodo:** Número de conexiones que tiene un agente
- Agente B: grado = 3 (tiene 3 vecinos)
- Agente A: grado = 2 (tiene 2 vecinos: B y D)

Este concepto es importante porque:
- Determina cuántos juegos juega cada agente por época
- Define el conjunto de estrategias que puede observar e imitar

**¿Por qué importa la estructura de la red?**

En modelos clásicos del Dilema del Prisionero, todos juegan contra todos ("well-mixed population"). Pero en la vida real:
- Solo interactúas con un subconjunto de la población (tu red social)
- Tu red tiene estructura específica (¿conexiones aleatorias? ¿hay influencers?)
- **La estructura afecta dramáticamente los resultados**

Este proyecto compara dos tipos fundamentales de redes que representan extremos del espectro de organización social:

---

### 2.7 Topología Erdős-Rényi: Redes Aleatorias Homogéneas

**¿Qué es?**

Una **red Erdős-Rényi** (también llamada red aleatoria) se construye de la forma más simple posible:

```
Regla: Para cada posible par de agentes (A, B):
       Lanzar moneda con probabilidad p
       Si sale cara → crear conexión A-B
       Si sale cruz → no conectar
```

**Relación con modelos clásicos:**

En teoría de juegos evolutiva clásica se usa el modelo de "**well-mixed population**" donde cualquier agente puede interactuar con cualquier otro con igual probabilidad (todos juegan contra todos). Erdős-Rényi es una versión con restricciones de red: no todos están conectados con todos, pero entre quienes SÍ hay conexión, estas se forman de manera completamente aleatoria y equiprobable.

**Parámetros:**
- `num_nodes`: número de agentes en la red
- `edge_probability`: probabilidad de conexión entre cada par (típicamente 0.05 - 0.15)

**Visualización del resultado:**

```
Ejemplo: 10 agentes, probabilidad p=0.2

A━━━B━━━C
┃   ┃   ┃
D━━━E━━━F
        ┃
    G━━━H━━━I
            ┃
            J
```

**Características observadas:**
- Grado promedio (2.2): A(2), B(3), C(2), D(2), E(3), F(3), G(1), H(3), I(2), J(1)
- Rango de grados: 1-3 conexiones (variación pequeña)
- Distribución homogénea: todos tienen conexiones similares
- No hay "super conectados" (hubs) ni "extremadamente aislados"

**Propiedades matemáticas:**

La belleza de Erdős-Rényi está en su **predictibilidad matemática**:

**Número esperado de aristas:**
```
E[aristas] = n × (n-1) × p / 2

Donde:
- n = número de nodos
- n × (n-1) = número de posibles pares de nodos
- p = probabilidad de conexión
- Dividimos por 2 porque cada arista se cuenta una vez (A-B es lo mismo que B-A)

Ejemplo con n=10, p=0.2:
E[aristas] = 10 × 9 × 0.2 / 2 = 9 aristas esperadas
(El ejemplo visual arriba tiene 10, ligeramente arriba por azar)
```

**Grado promedio esperado:**
```
E[grado] = (n-1) × p

Ejemplo con n=10, p=0.2:
E[grado] = 9 × 0.2 = 1.8 ≈ 2 conexiones por agente
```

**Distribución de grado:**

La distribución sigue una **distribución de Poisson** (forma de campana). Esto significa que:
- La mayoría de nodos tienen grados cercanos al promedio (1.8 ≈ 2)
- Muy pocos nodos tienen grados muy altos o muy bajos
- El promedio (2) SÍ representa bien la red
- Distribución homogénea: todos son "similares"

**Código:**
```python
# num_nodes = número de agentes
# edge_probability = probabilidad de conexión entre cada par
erdos_renyi = ErdosRenyiTopology(num_nodes=50, edge_probability=0.1)
erdos_renyi.generate_network()
```

**Impacto en cooperación:**
- Todos los agentes tienen influencia similar (estructura democrática)
- Comportamientos se difunden uniformemente en todas direcciones
- Cooperadores y egoístas compiten en igualdad de condiciones estructurales
- Dinámicas más predecibles y estables que en redes heterogéneas
- Sirve como **baseline de control** para comparar con redes más realistas

---

### 2.8 Topología Barabási-Albert: Redes Libres de Escala

**¿Qué es?**

Una **red Barabási-Albert** (o red libre de escala) modela redes sociales reales mediante **adhesión preferencial**:

```
Algoritmo de crecimiento:
1. Comenzar con m₀ nodos iniciales completamente conectados
2. Para cada nuevo nodo que entra a la red:
   - Se conecta con m nodos existentes
   - Probabilidad de conectarse con nodo i:

     P(conectar con i) = grado(i) / suma_total_grados

   → Los nodos populares tienen mayor probabilidad de ganar más conexiones
   → "El rico se hace más rico"
```

**Parámetros:**
- `num_nodes`: número final de nodos en la red
- `num_edges_attach`: número de conexiones que hace cada nuevo nodo (parámetro m)

**Visualización del proceso de construcción:**

```
Paso 1: Red inicial (m₀=3, todos conectados)

    A━━━B
     ╲ ╱
      C

Grados: A=2, B=2, C=2
Suma total de grados: 6


Paso 2: Entra D (debe hacer m=2 conexiones)
Probabilidades de conexión:
  P(conectar con A) = grado(A) / suma = 2/6 = 33.3%
  P(conectar con B) = grado(B) / suma = 2/6 = 33.3%
  P(conectar con C) = grado(C) / suma = 2/6 = 33.3%

→ Todos tienen la MISMA probabilidad (aún no hay preferencia)

Resultado (azar): D se conecta con A y C

    A━━━B
    ┃╲ ╱
    ┃ C
    ┃ ┃
    D━┛

Grados: A=3, B=2, C=3, D=2
Suma total de grados: 10


Paso 3: Entra E (debe hacer m=2 conexiones)
Probabilidades de conexión:
  P(conectar con A) = grado(A) / suma = 3/10 = 30%  ← MAYOR
  P(conectar con B) = grado(B) / suma = 2/10 = 20%
  P(conectar con C) = grado(C) / suma = 3/10 = 30%  ← MAYOR
  P(conectar con D) = grado(D) / suma = 2/10 = 20%

→ AHORA SÍ hay preferencia: A y C tienen más probabilidad (30% vs 20%)

Resultado (más probable): E se conecta con A y C

    ┏━━━━━E
    ┃     ┃
    A━━━B ┃
    ┃╲ ╱  ┃
    ┃ C━━━┛
    ┃ ┃
    D━┛

Grados: A=4, B=2, C=4, D=2, E=2
Suma total de grados: 14

→ A y C aumentan su ventaja (ahora tienen 4 conexiones cada uno)
→ B y D se quedan rezagados (solo 2 conexiones)
```

**Consecuencias del mecanismo:**
- **Estructura jerárquica:** Pocos muy conectados (hubs), muchos poco conectados (periféricos)
- **Early mover advantage:** A y C se volvieron hubs porque estaban desde el inicio
- **Desigualdad creciente:** Con más iteraciones, la brecha entre hubs y periféricos aumenta
- **Realismo:** Modela redes sociales reales (influencers vs usuarios comunes)

**Propiedades matemáticas:**

A diferencia de Erdős-Rényi, Barabási-Albert genera distribuciones **extremadamente heterogéneas**:

**Número de aristas:**
```
aristas = m × (n - m₀)

Donde:
- m = conexiones que hace cada nuevo nodo
- n = número total final de nodos
- m₀ = tamaño de la red inicial (típicamente m₀ = m + 1)

Ejemplo con n=50, m=2:
aristas = 2 × (50 - 3) = 94 conexiones
```

**Distribución de grado:**

La distribución sigue una **ley de potencias**: P(k) ∝ k^(-3)

En palabras: la probabilidad de tener k conexiones decrece como 1/k³. Esto genera una distribución extremadamente desigual.

Ejemplo típico con 50 nodos (m=2):
- 1-2 super hubs: 15-20 conexiones
- 5-10 hubs moderados: 5-8 conexiones
- 35-40 periféricos: 1-3 conexiones

**Grado promedio:**
```
E[grado] = 2m  (aproximadamente constante)

Ejemplo con m=2:
E[grado] = 2 × 2 = 4 conexiones por agente
```

**ADVERTENCIA sobre el promedio:**

El promedio (4) es **engañoso** en Barabási-Albert porque:
- Los super hubs tienen 15-20 conexiones (¡5 veces el promedio!)
- Los periféricos tienen 1-3 conexiones (menos del promedio)
- La MAYORÍA de nodos están por debajo del promedio
- El promedio está inflado por los pocos super hubs

Esto es lo opuesto a Erdős-Rényi donde el promedio SÍ representa bien la red.

**Código:**

```python
# num_nodes = número total de nodos finales
# num_edges_attach = cuántas conexiones hace cada nuevo nodo (m)
barabasi = BarabasiAlbertTopology(num_nodes=50, num_edges_attach=2)
barabasi.generate_network()
```

**Impacto en cooperación:**
- **Los hubs dominan la dinámica evolutiva**
- Si un hub es cooperador → promueve cooperación ampliamente
- Si un hub es egoísta → puede contagiar egoísmo a muchos
- Heterogeneidad extrema en influencia social
- Dinámicas más complejas e impredecibles que Erdős-Rényi

---

### 2.9 Comparación: Erdős-Rényi vs Barabási-Albert

| Característica | Erdős-Rényi | Barabási-Albert |
|---------------|-------------|-----------------|
| **Construcción** | Aleatoria (probabilidad fija) | Crecimiento + adhesión preferencial |
| **Distribución de grado** | Poisson (campana) | Ley de potencias (cola larga) |
| **Estructura** | Homogénea | Heterogénea (hubs + periféricos) |
| **Realismo social** | Bajo (baseline teórico) | Alto (modela redes reales) |
| **Influencia** | Equitativa | Concentrada en hubs |
| **Difusión de cooperación** | Uniforme | Dominada por estrategia de hubs |

Ahora que entendemos las redes estáticas, ¿qué pasa si **las redes pueden cambiar**? Los agentes pueden romper relaciones nocivas y formar nuevas alianzas.

### 2.10 Redes Dinámicas: Cuando las amistades cambian

En la vida real, las redes sociales no son estáticas:
- Terminas amistades que no funcionan
- Haces nuevos amigos a través de conocidos
- Conoces personas nuevas en contextos diferentes

Este proyecto implementa **tres mecanismos** de dinámica de red que modelan cómo evolucionan las conexiones sociales:

#### Mecanismo 1: Remoción de Aristas (Romper relaciones nocivas)

**Idea:** Si alguien te derrota consistentemente en las interacciones, podrías alejarte de esa persona.

**Regla:**
```python
# Para cada vecino V del agente A:
defeat_ratio = defeats_of_A_vs_V / total_games

if defeat_ratio > threshold:  # típicamente 60%
    break_probability = defeat_ratio

    if random() < break_probability:
        remove_edge(A, V)
```

**Ejemplo:**
- Has jugado 10 veces contra tu vecino Juan
- Juan te ha derrotado 8 veces (defeat_ratio = 0.8 = 80%)
- 80% > 60% (umbral) → consideras romper la relación
- Con probabilidad 80%, eliminas la conexión con Juan

**Efecto en dinámica:**
- Egoístas exitosos pueden **perder víctimas** (cooperadores se alejan)
- Si un egoísta pierde todas sus conexiones → queda **aislado** → **muere**
- Protege clusters de cooperadores (pueden aislarse de egoístas)

**Capa irracional (ε=0.01):**
- Con 1% de probabilidad, rompes una relación aleatoria (sin evaluar historial)
- O mantienes una relación nociva (error)

#### Mecanismo 2: Cierre Triádico (Amigos de amigos)

**Idea:** Granovetter (1973) observó que en redes sociales reales, ~40% de nuevas conexiones son "amigos de amigos".

**Regla:**
```
"El amigo de mi amigo se convierte en mi amigo"

    A━━━B           A━━━B━━━┓
        ┃       →       ┃   ┃   
        C━━━D           C━━━D 

D es amigo de C, C es amigo de B → D se hace amigo de B
```

**Implementación:**
```python
candidates = friends_of_friends(agent) - direct_friends(agent)

for candidate in candidates:
    relative_success = candidate_credits / population_average

    if relative_success > 1.25:  # 25% más rico que promedio
        connection_prob = 0.15    # 15% probabilidad
    else:
        connection_prob = 0.05    # 5% probabilidad

    if random() < connection_prob:
        create_edge(agent, candidate)
```

**Efecto:**
- **Cierre de triángulos:** Aumenta la densidad local de la red (amigos de amigos se vuelven amigos)
- **Sesgo hacia el éxito:** Preferencia (3x mayor probabilidad) por conectarse con agentes >25% más ricos que el promedio
- **Formación de clusters:** Tiende a crear grupos más cohesivos y densamente conectados
- **Reducción de distancias:** Las personas se vuelven más cercanas en la red (menos grados de separación)

#### Mecanismo 3: Lazos Débiles (Conociendo extraños)

**Idea:** Granovetter (1973) también mostró que los "lazos débiles" (conocidos lejanos) son cruciales para difundir información entre comunidades.

**Regla:**
```python
# Con baja probabilidad (2% por agente por época):
if random() < 0.02:
    non_neighbors = get_unconnected_agents(agent)
    stranger = random.choice(non_neighbors)
    create_edge(agent, stranger)
```

**Efecto:**
- **Previene fragmentación:** Conecta clusters que se habrían aislado
- **Difusión de innovación:** Estrategias exitosas se propagan entre comunidades
- **Puentes:** Crea "puentes" entre grupos sociales

#### Mecanismo 4: Rechazo Irracional de Interacciones

A diferencia de la **remoción racional de aristas** (Mecanismo 1), donde los agentes evalúan sistemáticamente el desempeño de sus conexiones antes de eliminarlas, el **rechazo irracional** modela situaciones donde un agente simplemente **se niega a jugar** con un vecino en una época específica, sin realizar ningún análisis previo.

**¿Qué situaciones modela?**

Este mecanismo captura aspectos impredecibles del comportamiento humano:
- **Conflictos personales temporales:** "Hoy no se me apetece hablar"
- **Indisponibilidad:** Enfermedad, viaje, ocupación
- **Estados emocionales:** Enojo, frustración, desconfianza momentánea
- **Errores de comunicación:** Olvidos, malentendidos

**Diferencias clave con la remoción racional:**

| Aspecto | Rechazo irracional | Remoción racional |
|---------|-------------------|-------------------|
| **Evaluación** | No analiza desempeño | Evalúa historial de derrotas |
| **Permanencia** | Temporal (1 época) | Permanente (elimina arista) |
| **Probabilidad** | `epsilon_refuse` (~0.5%) | Basada en `defeat_threshold` (60%) |
| **Estructura de red** | Conexión permanece intacta | Conexión desaparece del grafo |
| **Propósito** | Modelar irracionalidad humana | Optimizar red de contactos |

**Implementación:**

```python
# Cada época, antes de jugar:
for agent in agents:
    for neighbor in neighbors(agent):
        if random() < epsilon_refuse:
            # NO juegan esta época, pero la arista persiste
            skip_interaction(agent, neighbor)
            # Próxima época podrán jugar normalmente
```

**Parámetros de configuración:**

```yaml
network_dynamics:
  interaction_refusal:
    enable: false              # Desactivado por defecto
    epsilon_refuse: 0.005      # 0.5% probabilidad de rechazo por vecino
```

- **`enable`:** Activa/desactiva el mecanismo completamente
- **`epsilon_refuse`:** Probabilidad de que un agente rechace jugar con cada vecino en cada época
  - Valor típico: 0.005 (0.5%) - rechazos ocasionales
  - Valores altos: 0.05 (5%) - conflictos frecuentes

**Efecto esperado:**

- Valores altos de `epsilon_refuse` aumentan la frecuencia de interacciones rechazadas, reduciendo el número total de juegos por época
- La irracionalidad introduce **ruido** en la dinámica sin alterar la estructura de red permanentemente
- Complementa la remoción racional: un agente puede mantener conexiones valiosas pero ocasionalmente fallar en usarlas

#### Integración de los cuatro mecanismos

En cada época de la simulación, los mecanismos se ejecutan en este orden:

1. **Rechazo irracional:** Determinar qué interacciones se saltan (temporal)
2. **Juegos:** Dilema del Prisionero entre vecinos conectados (que no se rechazaron)
3. **Remoción de aristas:** Eliminar relaciones desfavorables (permanente, racional)
4. **Cierre triádico:** Conectar amigos-de-amigos
5. **Lazos débiles:** Conocer extraños
6. **Verificar aislados:** Detectar agentes que quedaron sin conexiones

```python
# Flujo completo de una época:

# 1. Determinar rechazos irracionales (opcional)
refused_pairs = process_interaction_refusal()  # epsilon_refuse

# 2. Juegos (excepto pares que se rechazaron)
for connected_pair in network.edges():
    if connected_pair not in refused_pairs:
        play_prisoners_dilemma(connected_pair)

update_credits()  # ±1 por victoria/derrota

# 3. Verificar muertes
process_deaths()  # Créditos ≤ 0 o aislamiento → muerte
if death_detected():
    terminate_simulation()  # ¡Primera muerte! FIN

# 4. Evolución de estrategias
evolve_strategies()  # Regla de Fermi + copia parcial

# 5. Dinámica de red (3 mecanismos racionales)
remove_unfavorable_edges()      # Mecanismo 1 (racional)
create_triadic_connections()    # Mecanismo 2
create_weak_ties()              # Mecanismo 3

# 6. Verificar nuevos aislados (por remoción de aristas)
process_deaths()
if death_detected():
    terminate_simulation()
```

Ahora que entendemos todos los mecanismos individuales, necesitamos un elemento final: **la economía que determina quién sobrevive**.

### 2.11 Economía de Supervivencia: Riqueza, desigualdad y muerte

#### El sistema de créditos

Cada agente tiene **créditos** (dinero, recursos, energía). Después de cada juego:

```python
# Juego entre A y B (5-20 rondas aleatorias)
score_A, score_B = play_prisoners_dilemma(A, B, rounds)

# Determinar ganador
if score_A > score_B:
    credits[A] += 1   # A gana
    credits[B] -= 1   # B pierde
elif score_B > score_A:
    credits[A] -= 1   # A pierde
    credits[B] += 1   # B gana
else:
    # Empate: sin cambios
    pass
```

**Propiedades:**
- Sistema de **suma cero local**: cada juego redistribuye riqueza (±1)
- Los empates no afectan créditos (evita inflación/deflación)
- Acumulación a largo plazo depende de estrategia y red

#### Distribución inicial: El Principio de Pareto

En la vida real, la riqueza está **desigualmente** distribuida. El famoso "Principio 80-20" dice:
- El 20% más rico posee ~80% de la riqueza total

Este proyecto usa la **distribución de Pareto** para modelar desigualdad realista:

```python
# Configuración típica:
economy:
  total_wealth: 10000     # Riqueza total a distribuir
  pareto_alpha: 1.16      # Parámetro de desigualdad (80-20 rule)
  min_credits: 1          # Nadie empieza con 0
```

**¿Por qué importa la desigualdad inicial?**

1. **Realismo:** Refleja condiciones iniciales del mundo real
2. **Hipótesis:** ¿Los ricos adoptan estrategias diferentes que los pobres?
3. **Supervivencia:** ¿La riqueza inicial predice supervivencia?
4. **Cooperación:** ¿La desigualdad favorece cooperación o egoísmo?

#### Condiciones de muerte

Un agente muere cuando:

```python
# Condición 1: Bancarrota
if credits[agent] < 0:
    death = True
    reason = "credit_exhaustion"

# Condición 2: Aislamiento social
if degree[agent] == 0:  # Sin conexiones
    death = True
    reason = "isolation"
```

**Terminación de la simulación:**

La simulación termina **inmediatamente** cuando ocurre la **primera muerte**:

```python
if len(alive_agents) < initial_population:
    terminate_simulation()
    reason = "Death detected (isolation or bankruptcy)"
```

**Este criterio:**
- Mide la robustez de la topología antes del primer fallo
- Evita modelar cascadas de fallos en redes degeneradas
- Proporciona una métrica consistente ("tiempo hasta primera muerte") para comparar topologías
- Captura el estado completo de la red en el momento crítico

#### Eventos externos: Fortuna e Infortunio

Para modelar imprevistos (enfermedad, herencia, accidente), con baja probabilidad (1% por agente por época):

```python
if random() < 0.01:
    percentage = random.randint(0, 20) / 100  # 0%, 1%, 2%... 20%

    if random() < 0.5:
        # FORTUNA
        credits[agent] += int(credits[agent] * percentage)
    else:
        # INFORTUNIO
        credits[agent] -= int(credits[agent] * percentage)
```

**Efecto:** Introduce aleatoriedad realista sin dominar la dinámica.

---

Ahora que hemos construido todos los fundamentos teóricos, integrémoslos en el **modelo completo**.

---

## 3. El Modelo: Integrando los Conceptos

### 3.1 Visión General del Sistema

El modelo integra todos los componentes descritos en un ciclo de simulación. Los valores mostrados son ejemplos; todos los parámetros se configuran en `config.yaml` (ver Sección 3.2 y Apéndice B).

**Inicialización:**
- Población de *n* agentes (ejemplo: 50) con estrategias memory-one aleatorias
- Riqueza total distribuida según Pareto (α=1.16, créditos mínimos configurables)
- Red social inicial: Erdős-Rényi o Barabási-Albert (parámetros configurables)

**Ciclo por época** (hasta primera muerte o límite de épocas):

1. **Rechazo irracional** (opcional):
   - Cada agente puede negarse a jugar con cada vecino (probabilidad `epsilon_refuse`)
   - La conexión permanece, solo se salta la interacción esta época

2. **Interacciones:**
   - Cada par conectado (que no se rechazó) juega Dilema del Prisionero
   - Número de rondas: aleatorio entre rango configurado (ej: 5-20)
   - Ruido opcional en decisiones - trembling hand (ver Sección 2.3.1, parámetro `noise_probability`)

3. **Economía:**
   - Ganador: +1 crédito
   - Perdedor: -1 crédito
   - Empate: sin cambio (sistema suma-cero local)

4. **Verificación de supervivencia:**
   - Muerte si: créditos ≤ 0 **O** grado = 0
   - Si ocurre muerte → **Terminar simulación inmediatamente**
   - Guardar estado final completo de la red

5. **Evolución de estrategias** (si no hubo muerte):
   - Cada agente compara su desempeño con un vecino aleatorio
   - Regla de Fermi: probabilidad de copiar estrategia exitosa (ver Sección 2.5.1)
   - Copia parcial opcional según umbrales de riqueza (ver Sección 2.5.3)
   - Mutación irracional con probabilidad `epsilon_mutation` (ver Sección 2.5.2)

6. **Dinámica de red** (4 mecanismos opcionales):
   - **Remoción:** Eliminar aristas desfavorables (evaluación racional del historial)
   - **Triádica:** Crear conexiones entre amigos-de-amigos
   - **Lazos débiles:** Conexiones aleatorias de largo alcance
   - **Rechazo:** Ya ejecutado en paso 1 (temporal, no modifica estructura)

7. **Eventos externos** (probabilidad configurable, típicamente 1%):
   - Fortuna: ganancia aleatoria de créditos (0-20%)
   - Infortunio: pérdida aleatoria de créditos (0-20%)

8. **Registro y visualización** (según configuración):
   - Guardar métricas de época (siempre)
   - Visualizar red (cada N épocas, si está habilitado)

9. **Verificar nuevos aislados:**
   - Por si la remoción de aristas dejó agentes sin conexiones
   - Si ocurre muerte → **Terminar simulación**

**Terminación:**
- **Condición principal:** Primera muerte detectada (bancarrota o aislamiento)
- **Condición alternativa:** Alcanzar `max_epochs` sin muertes
- **Salida:** Resultados en JSON + visualizaciones (según configuración)

### 3.2 Parámetros Clave del Modelo

Todos los parámetros se configuran en `config.yaml`:

```yaml
# === POBLACIÓN ===
population:
  num_agents: 50              # Número de agentes
  probability_step: 0.5       # Discretización de estrategias (0.0, 0.5, 1.0)

# === ECONOMÍA ===
economy:
  total_wealth: 10000         # Riqueza total a distribuir
  pareto_alpha: 1.16          # Desigualdad (80-20 rule)
  min_credits: 1              # Mínimo garantizado por agente

  external_events:
    enable: true              # Fortuna/Infortunio
    probability: 0.01         # 1% por agente por época

# === EVOLUCIÓN DE ESTRATEGIAS ===
strategy_evolution:
  enable: true
  epsilon_mutation: 0.001     # Probabilidad de copia irracional
  beta_fermi: 100.0           # Intensidad de selección

  enable_partial_copy: true   # Activar copia parcial (ver 2.5.3)
  copy_thresholds: [1.25, 1.5, 2.0]  # Umbrales de riqueza

# === DINÁMICA DE RED ===
network_dynamics:
  enable: true

  edge_removal:               # Romper amistades tóxicas
    enable: true
    defeat_threshold: 0.6     # >60% derrotas → considerar romper
    epsilon_irrational: 0.01  # 1% irracionalidad
    history_window: 5         # Evaluar últimas 5 épocas

  triadic_closure:            # Amigos de amigos
    enable: true
    epsilon_irrational: 0.01
    base_probability: 0.05    # 5% para agentes normales
    high_success_prob: 0.15   # 15% para agentes exitosos

  weak_ties:                  # Lazos débiles
    enable: true
    probability: 0.02         # 2% por agente por época

  interaction_refusal:        # Rechazo irracional
    enable: false             # Desactivado por defecto
    epsilon_refuse: 0.005     # 0.5% prob de rechazo por vecino

# === SIMULACIÓN ===
simulation:
  max_epochs: 200             # Máximo de épocas (si no hay muertes)
  min_game_turns: 5           # Mínimo de rondas por juego
  max_game_turns: 20          # Máximo de rondas por juego
  noise_probability: 0.001    # Ruido en decisiones (0.1%)

# === TOPOLOGÍAS ===
erdos_renyi:
  probability: 0.1            # 10% prob de conexión

barabasi_albert:
  m: 2                        # 2 conexiones por nuevo nodo

# === VISUALIZACIÓN ===
visualization:
  save_visualizations: true
  epoch_interval: 10          # Guardar cada 10 épocas

# === EXPERIMENTO MÚLTIPLE ===
mega_experiment:
  num_populations: 10         # 10 poblaciones diferentes
  simulations_per_topology: 5 # 5 instancias de cada topología
  # Total: 10 × 5 × 2 = 100 simulaciones
```

### 3.3 Dos Mundos para Comparar

El proyecto ejecuta cada población en **dos topologías** para análisis comparativo:

#### Erdős-Rényi (Mundo Aleatorio)

```python
erdos_renyi = ErdosRenyiTopology(n=50, p=0.1)
```

**Características:**
- Conexiones aleatorias independientes
- Distribución de grado: Poisson (homogénea)
- Grado promedio: n × p = 50 × 0.1 = 5 amigos
- Sin hubs ni estructura modular clara

**Hipótesis:**
- Comportamientos se difunden uniformemente
- Cooperadores y egoístas compiten en igualdad de condiciones
- Más aleatorio, menos predecible

#### Barabási-Albert (Mundo con Influencers)

```python
barabasi = BarabasiAlbertTopology(n=50, m=2)
```

**Características:**
- Crecimiento + adjunción preferencial
- Distribución de grado: ley de potencia (heterogénea)
- Presencia de hubs (nodos altamente conectados)
- Estructura jerárquica

**Hipótesis:**
- Los hubs dominan la dinámica evolutiva
- Si hubs adoptan cooperación → se difunde ampliamente
- Heterogeneidad en influencia social
- Potencialmente más resiliente (o más frágil)

---

Con el modelo completo definido, ahora aprendamos a **usar la herramienta**.

---

## 4. La Herramienta: Del Concepto al Código

### 4.1 Instalación y Primera Ejecución

#### Requisitos

- Python 3.9 o superior
- Sistema operativo: Windows, macOS o Linux
- 4 GB de RAM (mínimo)

#### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/cooperation-survival-prisoners-dilemma.git
cd cooperation-survival-prisoners-dilemma
```

#### Paso 2: Instalar dependencias

```bash
pip install -r requirements.txt
```

**Dependencias principales:**
- `numpy`: Computación numérica (distribución Pareto)
- `networkx`: Generación y análisis de redes
- `matplotlib`: Visualización de redes
- `pyyaml`: Lectura de configuración

#### Paso 3: Ejecutar con configuración por defecto

```bash
python main.py
```

**Salida esperada en consola:**

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

#### Paso 4: Explorar resultados

```bash
# Navegar a la carpeta de resultados
cd results/mega_20250109_143022/

# Abrir README generado automáticamente
open README.md  # macOS
xdg-open README.md  # Linux
start README.md  # Windows

# El README contiene:
# - Resumen ejecutivo
# - Análisis comparativo Erdős-Rényi vs Barabási-Albert
# - Resultados por población
# - Instrucciones de navegación
```

¡Felicidades! Has ejecutado tu primer experimento.

### 4.2 Entendiendo la Estructura de Resultados

Después de ejecutar, la carpeta de resultados se ve así:

```
results/mega_20250109_143022/
│
├── README.md                      # Resumen ejecutivo (EMPEZAR AQUÍ)
├── populations_index.json         # Índice de todas las poblaciones
├── mega_analysis.json             # Análisis comparativo global
│
├── key_visualizations/            # Gráficos principales
│   ├── epochs_comparison.png      # Erdős-Rényi vs Barabási-Albert
│   ├── cooperation_evolution.png  # Evolución de cooperación
│   └── wealth_distribution.png    # Distribución de riqueza
│
└── populations/                   # Datos de cada población
    ├── pop_001/
    │   ├── population_info.json   # Composición inicial
    │   │
    │   ├── erdos/                 # Resultados Erdős-Rényi
    │   │   ├── sim_001/
    │   │   │   ├── results.json           # Datos completos
    │   │   │   ├── agent_lifecycles.json  # Historial de eventos por agente
    │   │   │   └── visualizations/        # Gráficos de red
    │   │   │       ├── epoch_000.png      # Red inicial
    │   │   │       ├── epoch_010.png
    │   │   │       └── epoch_final.png    # Estado al terminar
    │   │   ├── sim_002/
    │   │   └── ... (sim_003, sim_004, sim_005)
    │   │
    │   └── barabasi/              # Resultados Barabási-Albert
    │       ├── sim_001/
    │       └── ... (sim_002-005)
    │
    ├── pop_002/
    └── ... (pop_003-010)
```

**Archivos clave:**

1. **`README.md`** (generado automáticamente)
   - Resumen de resultados
   - Comparación entre topologías
   - Instrucciones de navegación

2. **`mega_analysis.json`** (análisis global)
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

3. **`results.json`** (por simulación individual)
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

4. **`agent_lifecycles.json`** (historial detallado de eventos)
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
             "params_copied": [0, 2]  // Solo copió p y r
           }
         ],

         "death_epoch": 5,
         "death_reason": "isolation"
       }
     }
   }
   ```

### 4.3 Configurando tu Primer Experimento Personalizado

Ahora modifiquemos `config.yaml` para un experimento rápido de prueba:

```yaml
# config.yaml

# === POBLACIÓN ===
population:
  num_agents: 30              # Menos agentes → más rápido
  probability_step: 0.5       # Mantener 81 estrategias

# === ECONOMÍA ===
economy:
  total_wealth: 5000          # Menos riqueza total
  pareto_alpha: 1.16
  min_credits: 1

  external_events:
    enable: false             # Desactivar para simplicidad

# === EVOLUCIÓN ===
strategy_evolution:
  enable: true
  epsilon_mutation: 0.001
  beta_fermi: 100.0
  enable_partial_copy: true   # Probar contribución novedosa
  copy_thresholds: [1.25, 1.5, 2.0]

# === DINÁMICA DE RED ===
network_dynamics:
  enable: true                # Activar para ver efecto

  edge_removal:
    enable: true
    defeat_threshold: 0.6
    epsilon_irrational: 0.01
    history_window: 5

  triadic_closure:
    enable: false             # Desactivar para aislar efecto

  weak_ties:
    enable: false             # Desactivar para aislar efecto

# === SIMULACIÓN ===
simulation:
  max_epochs: 50              # Reducir para pruebas rápidas

# === TOPOLOGÍAS ===
erdos_renyi:
  probability: 0.15           # Más conexiones → más interacciones

barabasi_albert:
  m: 3                        # Más conexiones por nodo

# === VISUALIZACIÓN ===
visualization:
  save_visualizations: true
  epoch_interval: 5           # Guardar cada 5 épocas

# === EXPERIMENTO ===
mega_experiment:
  num_populations: 3          # Solo 3 poblaciones de prueba
  simulations_per_topology: 2 # 2 instancias de cada
  # Total: 3 × 2 × 2 = 12 simulaciones (~2-3 minutos)
```

Ejecutar:

```bash
python main.py
```

### 4.4 Casos de Uso Prácticos

#### Caso de Uso 1: Comparar Erdős-Rényi vs Barabási-Albert

**Pregunta:** ¿En qué topología sobreviven más tiempo los agentes?

**Configuración:**
```yaml
mega_experiment:
  num_populations: 5
  simulations_per_topology: 10  # Más instancias → mayor robustez estadística
```

**Análisis:**
```bash
# Después de ejecutar, revisar:
cat results/mega_TIMESTAMP/mega_analysis.json

# Buscar:
# - "mean_epochs": ¿Cuál topología tiene más épocas promedio?
# - "p_value": ¿Es estadísticamente significativo? (p < 0.05)
```

**Interpretación:**
- Si Barabási-Albert tiene más épocas → estructura con hubs favorece supervivencia
- Si Erdős-Rényi tiene más épocas → homogeneidad favorece supervivencia

#### Caso de Uso 2: Efecto de Copia Parcial vs Completa

**Pregunta:** ¿La copia parcial genera mayor diversidad?

**Experimento A (copia parcial):**
```yaml
strategy_evolution:
  enable_partial_copy: true
```

Ejecutar y guardar resultados:
```bash
python main.py
mv results/mega_TIMESTAMP results/experiment_partial
```

**Experimento B (copia completa):**
```yaml
strategy_evolution:
  enable_partial_copy: false  # Solo copia completa
```

Ejecutar:
```bash
python main.py
mv results/mega_TIMESTAMP results/experiment_full
```

**Análisis:**
```python
# Script de comparación:
import json

# Cargar resultados
with open('results/experiment_partial/mega_analysis.json') as f:
    partial = json.load(f)

with open('results/experiment_full/mega_analysis.json') as f:
    full = json.load(f)

# Comparar diversidad estratégica
print(f"Diversidad (parcial): {partial['strategy_diversity']}")
print(f"Diversidad (completa): {full['strategy_diversity']}")
```

#### Caso de Uso 3: Impacto de Dinámica de Red

**Pregunta:** ¿La remoción de aristas afecta supervivencia?

**Experimento A (sin dinámica):**
```yaml
network_dynamics:
  enable: false  # Red estática
```

**Experimento B (con remoción de aristas):**
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

**Análisis:** Comparar `mean_epochs` entre ambos experimentos.

#### Caso de Uso 4: Experimento Completo para Publicación

**Configuración robusta:**

```yaml
population:
  num_agents: 100              # Población grande
  probability_step: 0.25       # 625 estrategias (alta diversidad)

simulation:
  max_epochs: 300              # Permitir evolución larga

mega_experiment:
  num_populations: 20          # Muchas poblaciones
  simulations_per_topology: 10 # Alta replicación
  # Total: 20 × 10 × 2 = 400 simulaciones

visualization:
  save_visualizations: true
  epoch_interval: 20           # Menos frecuente (ahorro de espacio)
```

#### Caso de Uso 5: Impacto del Rechazo Irracional

**Pregunta de investigación:** ¿Cómo afectan las interrupciones irracionales de interacción a la supervivencia de la red?

**Hipótesis:** Mayor tasa de rechazo → menos oportunidades de cooperación → muerte más temprana de la red.

**Diseño experimental:**

Comparar tres escenarios con topología fija (Barabási-Albert, m=3) y población constante:

```yaml
# Escenario A: Sin rechazo (control)
network_dynamics:
  interaction_refusal:
    enable: false

# Escenario B: Rechazo bajo (0.5%)
network_dynamics:
  interaction_refusal:
    enable: true
    epsilon_refuse: 0.005  # 0.5% prob por vecino

# Escenario C: Rechazo moderado (2%)
network_dynamics:
  interaction_refusal:
    enable: true
    epsilon_refuse: 0.02   # 2% prob por vecino

# Escenario D: Rechazo alto (5%)
network_dynamics:
  interaction_refusal:
    enable: true
    epsilon_refuse: 0.05   # 5% prob por vecino
```

**Métricas a comparar:**
- Tiempo hasta primera muerte (épocas de supervivencia)
- Número promedio de interacciones por época (debería disminuir con mayor `epsilon_refuse`)
- Dispersión de créditos en momento de muerte
- Estrategias dominantes al final

**Resultado esperado:**
- Escenario A (sin rechazo) sobrevive más épocas
- Escenario D (rechazo alto) colapsa rápidamente
- Relación inversa entre `epsilon_refuse` y supervivencia

---

## 5. Arquitectura del Software

Esta sección describe brevemente la organización del código. No es necesario entenderla completamente para **usar** la herramienta, pero sí para **extenderla** o **modificarla**.

### 5.1 Módulos Principales

```
cooperation-survival-prisoners-dilemma/
│
├── core_simulation/              # Estrategias y evolución
│   ├── strategy.py               # Clase Strategy (memory-one)
│   ├── strategy_evolution.py    # Regla de Fermi + copia parcial
│   └── strategy_generator.py    # Generador de espacio S(p,q,r,s)
│
├── network_topologies/           # Generadores de redes
│   ├── base_topology.py          # Clase abstracta base
│   ├── erdos_renyi.py            # Red aleatoria
│   └── barabasi_albert.py        # Red libre de escala
│
├── network_dynamics/             # Mecanismos de adaptación
│   ├── interaction_history.py    # Historial de juegos
│   └── edge_manager.py           # Remoción, triadic, weak ties
│
├── network_simulation/           # Motor principal
│   └── network_game.py           # Orquestación completa
│
├── supporting_infrastructure/    # Utilidades
│   ├── payoff_matrix.py          # Matriz de pagos
│   ├── wealth_distribution.py    # Distribución Pareto
│   ├── population_generator.py   # Generación de poblaciones
│   ├── config_loader.py          # Carga de configuración
│   ├── agent_tracker.py          # Historial de eventos de agentes
│   ├── mega_experiment_runner.py # Orquestador
│   └── readme_generator.py       # Generación de README
│
└── visualization/                # Visualización
    ├── network_visualizer.py     # Gráficos de red
    └── comparative_analyzer.py   # Análisis comparativo
```

### 5.2 Flujo de Datos Simplificado

```
ENTRADA: config.yaml
    ↓
MegaExperimentRunner.run()
    ↓
Para cada población:
    ↓
    Generar estrategias + créditos (Pareto)
    ↓
    Para cada topología (Erdős-Rényi, Barabási-Albert):
        ↓
        Crear M instancias con seeds diferentes
        ↓
        NetworkGameV2.run_simulation():
            ↓
            Bucle de épocas:
                ├─ Juegos (Strategy.play_game)
                ├─ Actualizar créditos (±1)
                ├─ Procesar muertes
                ├─ Evolución (Regla de Fermi)
                ├─ Dinámica de red (EdgeManager)
                └─ Guardar visualización
            ↓
            Terminar si muerte o max_epochs
    ↓
Análisis comparativo
    ↓
SALIDA: results/mega_TIMESTAMP/
```

### 5.3 Cómo Extender la Herramienta

#### Agregar una Nueva Topología

**Paso 1:** Crear nueva clase en `network_topologies/`:

```python
# network_topologies/small_world.py

from network_topologies.base_topology import BaseTopology
import networkx as nx

class SmallWorldTopology(BaseTopology):
    def __init__(self, n: int, k: int, p: float):
        """
        Red de mundo pequeño (Watts-Strogatz).

        Args:
            n: Número de nodos
            k: Grado inicial (cada nodo conectado con k vecinos)
            p: Probabilidad de reconexión
        """
        super().__init__(num_nodes=n)
        self.k = k
        self.p = p

    def generate_network(self):
        """Generar red usando NetworkX."""
        self.graph = nx.watts_strogatz_graph(
            n=self.num_nodes,
            k=self.k,
            p=self.p
        )
        return self.graph
```

**Paso 2:** Registrar en configuración:

```yaml
# config.yaml

small_world:
  k: 4   # Grado inicial
  p: 0.1 # Probabilidad de reconexión
```

**Paso 3:** Usar en experimento:

```python
# main.py o script personalizado

from network_topologies.small_world import SmallWorldTopology

topology = SmallWorldTopology(n=50, k=4, p=0.1)
# Resto del código igual...
```


---

## 6. Limitaciones y Posibles Extensiones

### 6.1 Supuestos del Modelo

| Supuesto | Realidad | Impacto |
|----------|----------|---------|
| Estrategias memory-one | Humanos tienen memoria más larga | Simplificación razonable para análisis |
| Información perfecta | En realidad hay información imperfecta | Modelado parcialmente con ruido (ε) |
| Interacciones por pares | Pueden existir interacciones grupales | Extensión futura posible |
| Pagos simétricos | Contexto puede afectar pagos | Matriz de pagos es configurable |
| Población cerrada | Nacimientos/inmigración posibles | Enfoque en dinámica de población fija |

### 6.2 Limitaciones Conceptuales

1. **Espacio de estrategias:**
   - Limitado a memory-one (4 parámetros)
   - No explora estrategias con memoria más larga

2. **Dinámica de red:**
   - Cuatro mecanismos implementados: remoción de aristas, cierre triádico, lazos débiles, y rechazo irracional
   - Muchos otros mecanismos posibles (comunidad, homofilia, preferencia temporal, etc.)

3. **Economía:**
   - No modela producción, comercio, herencia
   - Enfocado solo en redistribución por competencia

### 6.3 Posibles Extensiones

Este proyecto establece bases sólidas que pueden ser extendidas por investigadores interesados. El diseño modular facilita incorporar nuevas funcionalidades sin modificaciones mayores.

**Direcciones posibles:**

1. **Topologías de red:**
   - Small-world (Watts-Strogatz)
   - Redes modulares (comunidades predefinidas)
   - Lattices espaciales
   - Redes temporales (conexiones que cambian dinámicamente)

2. **Espacio de estrategias:**
   - Memory-two o memory-k (memoria más larga)
   - Aprendizaje por refuerzo
   - Estrategias condicionales más complejas

3. **Mecanismos económicos:**
   - Múltiples tipos de recursos
   - Producción, comercio e intercambio
   - Dinámica de nacimientos y muertes
   - Herencia de riqueza entre generaciones

4. **Análisis y visualización:**
   - Tests estadísticos automatizados
   - Detección de patrones emergentes
   - Visualizaciones interactivas
   - Comparación con datos empíricos

La arquitectura modular del código (ver Sección 5) permite agregar estos componentes como extensiones independientes.

---

## 7. Referencias

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

Miękisz, J., et al. (2024). Phase transitions in the Prisoner’s Dilemma game on the Barabási–Albert graph with participation cost.

Zimmermann, M. G., & Eguíluz, V. M. (2005). Cooperation, social networks, and the emergence of leadership in a prisoner’s dilemma with adaptive local interactions.

---

## 8. Apéndices

### Apéndice A: Glosario de Términos

| Término | Definición |
|---------|------------|
| **Agente** | Entidad simulada que toma decisiones (juega, aprende, interactúa) |
| **Altruista** | Estrategia con suma de probabilidades > 2.0 (tendencia a cooperar) |
| **Arista** | Conexión entre dos agentes (relación social) |
| **Clustering** | Medida de qué tan conectados están los vecinos de un nodo entre sí |
| **Copia parcial** | Mecanismo donde se copian solo algunos parámetros según riqueza relativa |
| **Cooperar** | Acción de ayudar al oponente en el Dilema del Prisionero |
| **Desertar** | Acción egoísta de maximizar beneficio propio |
| **Epsilon (ε)** | Parámetro de irracionalidad/ruido en decisiones |
| **Época** | Ciclo completo de juegos, evolución y dinámica de red |
| **Fitness** | Medida de éxito (en este modelo: créditos acumulados) |
| **Grado** | Número de conexiones que tiene un nodo |
| **Hub** | Nodo con grado muy alto (altamente conectado) |
| **Infortunio** | Evento aleatorio que reduce créditos de un agente |
| **Memory-one** | Estrategia que solo recuerda resultado del turno anterior |
| **Mutación irracional** | Copiar estrategia de vecino sin evaluar si es mejor (exploración) |
| **Nodo** | Agente en la representación de red (grafo) |
| **Pareto** | Distribución estadística que modela desigualdad (ley de potencia) |
| **Rechazo irracional** | Negarse a jugar con un vecino sin evaluar desempeño (temporal) |
| **Regla de Fermi** | Función probabilística para imitación basada en diferencia de fitness |
| **Remoción racional** | Eliminar una arista tras evaluar que no es beneficiosa (permanente) |
| **Topología** | Estructura de conexiones de la red (quién está conectado con quién) |
| **Trembling hand** | Error de ejecución donde se ejecuta acción diferente a la intención |
