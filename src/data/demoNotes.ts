import { DemoSubject } from '../types/viva';

export const DEMO_SUBJECTS: DemoSubject[] = [
  {
    id: 'physics',
    label: 'Physics',
    subtitle: 'Electromagnetism & Wave Optics',
    notes: `ENGINEERING PHYSICS — UNIT 3: ELECTROMAGNETISM & WAVE OPTICS

1. Faraday's Laws of Electromagnetic Induction
Definition: Electromagnetic induction is the phenomenon of inducing an electromotive force (EMF) across an electrical conductor when it is exposed to a time-varying magnetic flux.
- First Law: Whenever the magnetic flux linked with a closed circuit changes, an EMF is induced in the circuit, lasting only as long as the change continues.
- Second Law: The magnitude of the induced EMF is directly proportional to the rate of change of magnetic flux linkage.
Formula: e = -N (dPhi_B / dt), where N is the number of turns and Phi_B = B * A * cos(theta) is the magnetic flux in Weber (Wb).

2. Lenz's Law & Conservation of Energy
Why the negative sign exists: Lenz's law states that the direction of the induced current always opposes the change in magnetic flux that produced it. If the induced current instead aided the flux change, kinetic energy and electrical energy would both grow without external work, violating the law of conservation of energy. Therefore, mechanical work must be done against the opposing magnetic force, which gets converted into electrical energy.

3. Eddy Currents
When a bulk metallic conductor moves in a non-uniform magnetic field or sits in a changing magnetic field, swirling loops of induced currents called eddy currents circulate inside the body of the metal.
- Undesirable effect: Causes I^2*R Joule heating losses in transformer cores. To minimize eddy current loss, cores are laminated into thin insulated steel sheets rather than made of a solid iron block.
- Applications: Electromagnetic braking in high-speed trains, induction furnaces for melting metals, and dead-beat damping in moving-coil galvanometers.

4. Optical Interference & Young's Double-Slit Experiment (YDSE)
Definition: Interference is the redistribution of light intensity due to the superposition of two coherent light waves having the same frequency and a constant phase difference.
- Constructive interference (bright fringe) occurs when path difference delta_x = n * lambda (n = 0, 1, 2...).
- Destructive interference (dark fringe) occurs when path difference delta_x = (2n - 1) * (lambda / 2).
- Fringe width formula: beta = (lambda * D) / d, where lambda is wavelength, D is screen distance, and d is slit separation.
- What happens if the entire YDSE apparatus is immersed in water (refractive index mu = 1.33)? Since wavelength in a medium decreases to lambda' = lambda / mu, the fringe width beta' = beta / mu shrinks, making the interference fringes move closer together. If one slit is closed, interference disappears and only a single-slit diffraction pattern remains.`,
  },
  {
    id: 'electrical',
    label: 'Electrical',
    subtitle: 'Transformers & AC Circuits',
    notes: `BASIC ELECTRICAL ENGINEERING — SINGLE-PHASE TRANSFORMERS & AC CIRCUITS

1. Single-Phase Transformer Working Principle
Definition: A transformer is a static electromagnetic device that transfers electrical power from one alternating current (AC) circuit to another at the same frequency, typically stepping voltage up or down through mutual induction.
How it works: When an alternating voltage V1 is applied to the primary winding (N1 turns), an alternating magnetizing current flows and sets up an alternating magnetic flux Phi in the laminated silicon-steel core. This alternating flux links with the secondary winding (N2 turns) and induces an EMF E2 by Faraday's law of mutual induction.

2. EMF Equation & Transformation Ratio
- RMS induced EMF in primary: E1 = 4.44 * f * N1 * Phi_m
- RMS induced EMF in secondary: E2 = 4.44 * f * N2 * Phi_m
Here, f is supply frequency in Hz and Phi_m is maximum core flux in Weber.
- Voltage Transformation Ratio: K = E2 / E1 = N2 / N1 = I1 / I2 (for an ideal transformer, input apparent power V1*I1 equals output apparent power V2*I2).

3. Why a Transformer Never Works on DC Supply
If a direct current (DC) voltage is connected across the primary winding, the magnetic flux produced is constant (dPhi / dt = 0). Because there is no rate of change of flux, zero EMF is induced in the secondary winding. Worse, there is no opposing self-induced back EMF (E1 = 0) in the primary, and since primary winding resistance R1 is very small, a dangerously high DC current (I = V_dc / R1) flows and burns out the primary winding insulation.

4. Transformer Losses & Efficiency
- Core (Iron) Losses: Constant at all loads; consists of Hysteresis loss (reduced by using silicon steel) and Eddy current loss (reduced by laminating the core into thin sheets).
- Copper Losses: Variable load losses equal to I1^2*R1 + I2^2*R2 in the windings.
- Maximum Efficiency Condition: A transformer achieves maximum efficiency when variable copper loss equals constant core loss (P_cu = P_iron).

5. Power Factor & Real-World Applications
- Power factor is cos(phi) = Real Power (P) / Apparent Power (S) = R / Z in an AC circuit. Low lagging power factor increases line current for the same real power, raising I^2*R transmission losses.
- Applications: Step-up transformers at power generating stations raise transmission voltage (e.g., to 132 kV or 400 kV) to reduce line current and copper losses over long distances; step-down distribution transformers lower voltage to 230 V for safe household use.`,
  },
  {
    id: 'chemistry',
    label: 'Chemistry',
    subtitle: 'Electrochemistry & Chemical Thermodynamics',
    notes: `ENGINEERING CHEMISTRY — ELECTROCHEMISTRY & THERMODYNAMICS

1. Galvanic Cell & Electrode Potential
Definition: A galvanic (voltaic) cell is an electrochemical device that converts chemical energy from a spontaneous redox reaction directly into electrical energy.
- Anode: The electrode where oxidation (loss of electrons) occurs; it carries a negative charge in a galvanic cell (e.g., Zinc rod in ZnSO4).
- Cathode: The electrode where reduction (gain of electrons) occurs; it carries a positive charge (e.g., Copper rod in CuSO4).
- Role of the Salt Bridge: A U-shaped tube filled with an inert electrolyte like KCl or KNO3 in agar-agar gel. It completes the internal electrical circuit by allowing ion migration and maintains electrical neutrality in both half-cells by preventing liquid junction potential buildup. Without a salt bridge, excess positive ions accumulate in the anode half-cell and excess negative ions in the cathode half-cell, immediately stopping electron flow and dropping cell EMF to zero.

2. Nernst Equation
The Nernst equation relates the non-standard electrode or cell potential to standard electrode potential, temperature, and ion concentrations.
Formula at 298 K (25°C):
E_cell = E°_cell - (0.0591 / n) * log10(Q)
where E°_cell = E°_cathode - E°_anode, n is the number of moles of electrons transferred in the balanced redox reaction, and Q is the reaction quotient ([Products] / [Reactants]).
Relation to Gibbs Free Energy: Delta_G = -n * F * E_cell, where F = 96,485 C/mol is Faraday's constant. A reaction is spontaneous only when E_cell > 0 (meaning Delta_G < 0).

3. Corrosion & Electrochemical Rusting of Iron
Definition: Corrosion is the gradual deterioration of a metal through unwanted chemical or electrochemical reaction with its environment.
How wet rusting happens: In the presence of moisture and dissolved oxygen, microscopic anodic and cathodic areas form on iron. At the anode, iron oxidizes to Fe^2+ ions; electrons travel through the metal to the cathode where oxygen reduces in water to OH^- ions, ultimately forming hydrated ferric oxide (Fe2O3 · xH2O, rust).

4. Applications — Cathodic Protection
- Sacrificial Anodic Protection: A more electrochemically active (more negative standard reduction potential) metal such as Magnesium (Mg) or Zinc (Zn) is electrically connected to an underground steel pipeline or ship hull. The sacrificial anode corrodes preferentially while protecting the iron structure as the cathode.
- What if a less reactive metal like Copper were bolted to an iron pipe instead of Zinc? Because iron is more reactive than copper, iron would become the anode and corrode significantly faster (galvanic corrosion).`,
  },
  {
    id: 'dbms',
    label: 'DBMS',
    subtitle: 'Normalization, ACID & Indexing',
    notes: `DATABASE MANAGEMENT SYSTEMS — NORMALIZATION, TRANSACTIONS & INDEXING

1. Database Normalization & Anomalies
Definition: Normalization is the systematic process of organizing relational database tables and attributes to reduce data redundancy and eliminate insertion, update, and deletion anomalies.
- First Normal Form (1NF): Every table cell must contain only atomic (indivisible) values, with no repeating groups or multi-valued attributes.
- Second Normal Form (2NF): Must be in 1NF and have no partial dependency — every non-prime attribute must be functionally dependent on the entire composite primary key, not just part of it.
- Third Normal Form (3NF): Must be in 2NF and have no transitive dependency — non-prime attributes must depend directly on the candidate key, not on another non-prime attribute (if A -> B and B -> C, separate B -> C into its own table).
- Boyce-Codd Normal Form (BCNF): A stricter version of 3NF where for every non-trivial functional dependency X -> Y, X must be a superkey.

2. ACID Properties of Transactions
A transaction is a single logical unit of work that accesses and modifies database contents. To guarantee reliability despite concurrent access or system crashes, DBMS engines enforce ACID:
- Atomicity ("All or Nothing"): Either every operation in a transaction commits completely, or none takes effect (rolled back on failure). Managed by the Recovery Manager using undo logs.
- Consistency: A transaction transitions the database from one valid state satisfying all integrity constraints to another valid state.
- Isolation: Concurrent transactions execute as if they were running serially without exposing uncommitted intermediate states (preventing dirty reads, lost updates, and phantom reads). Managed by the Concurrency Control Manager (e.g., Two-Phase Locking, 2PL).
- Durability: Once a transaction commits, its changes survive power loss or crashes because changes are written to non-volatile redo logs (Write-Ahead Logging, WAL).

3. B+ Tree Indexing & Time Complexity
Why B+ Trees are preferred over Binary Search Trees in databases: Disk I/O is orders of magnitude slower than RAM access. A B+ tree has a very high branching factor (order m), keeping tree height extremely shallow (typically 3 to 4 levels for millions of rows).
- Search cost formula: O(log_m N) disk accesses, where m is the order of the B+ tree and N is the number of records.
- In a B+ tree, all actual record pointers reside only in the leaf nodes, and all leaf nodes are linked sequentially in a linked list.
- Applications: Accelerating primary key lookups and fast range queries (such as WHERE salary BETWEEN 50000 AND 90000) without traversing back up internal nodes.
- What-if trade-off: What happens if you create indexes on every single column of a write-heavy table? While SELECT queries become faster, INSERT, UPDATE, and DELETE operations slow down noticeably because every write must also update multiple B+ tree index structures and consume extra disk storage.`,
  },
];
