# 🐜 Ant Colony Simulator

A browser-based ant colony simulation featuring swarm intelligence, deep resource management, and satisfying visuals.

![Ant Colony Banner](https://img.shields.io/badge/status-in%20development-orange)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

### 🏗️ Colony Building
- **Dynamic nest construction** — Watch ants excavate tunnels and chambers
- **Room specialization** — Nurseries, food storage, queen's chamber, waste disposal
- **Structural integrity** — Tunnels can collapse if poorly supported

### 📦 Resource Management
- **Food types** — Seeds, fungus, honeydew, insect parts (each with different nutritional values)
- **Materials** — Soil, leaves, pebbles for construction
- **Larvae care** — Feed and temperature requirements for ant development
- **Seasonal cycles** — Prepare for winter, manage scarce resources

### 🧠 Swarm Intelligence
- **Pheromone trails** — Visual trails that fade over time
- **Role assignment** — Workers, soldiers, nurses, foragers (dynamic reallocation)
- **Emergent behavior** — No central control, complex patterns from simple rules
- **Spatial hashing** — Efficient collision and proximity detection for thousands of ants

### ✨ Visuals
- **Particle effects** — Dust, pheromone clouds, digging debris
- **Smooth animations** — 60fps with efficient rendering
- **Day/night cycle** — Lighting changes affect ant behavior
- **Zoom and pan** — Explore the colony at any scale

## Getting Started

```bash
# Clone the repository
git clone https://github.com/kimkap999-oss/ant-colony-sim.git
cd ant-colony-sim

# Open in browser (no build step required)
open index.html
# Or use a local server
npx serve .
```

## Architecture

```
ant-colony-sim/
├── index.html          # Entry point
├── css/
│   └── style.css       # Visual styling
├── js/
│   ├── main.js         # Bootstrap and game loop
│   ├── colony.js       # Colony state and management
│   ├── ant.js          # Individual ant behavior
│   ├── swarm.js        # Spatial hashing and swarm coordination
│   ├── resources.js    # Resource types and management
│   ├── pheromones.js   # Pheromone grid and diffusion
│   ├── renderer.js     # Canvas rendering and effects
│   └── particles.js    # Particle system for visuals
└── assets/
    └── sprites/        # Ant and resource sprites
```

## Controls

| Key | Action |
|-----|--------|
| `Space` | Pause/Resume |
| `+` / `-` | Zoom in/out |
| `Arrow keys` | Pan camera |
| `1-4` | Change game speed |
| `D` | Toggle debug view |
| `P` | Toggle pheromone visibility |

## Performance

The simulation uses several optimization techniques:

- **Spatial hashing** — O(1) neighbor lookup instead of O(n²)
- **Object pooling** — Reuse ant and particle objects
- **Dirty rectangles** — Only redraw changed areas
- **Web Workers** — Offload pathfinding calculations (planned)

Target: **10,000+ ants** at 60fps on modern hardware.

## Roadmap

- [x] Basic ant movement and pheromones
- [x] Resource gathering
- [x] Nest excavation
- [ ] Ant lifecycle (egg → larva → pupa → adult)
- [ ] Predators and colony defense
- [ ] Multiple colonies and warfare
- [ ] Save/load colony state
- [ ] Mobile touch controls

## Contributing

Contributions welcome! Please read the contributing guidelines first.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License — see [LICENSE](LICENSE) for details.

## Acknowledgments

- Inspired by real ant colony behavior research
- Pheromone algorithms based on Dorigo's Ant Colony Optimization
- Visual style influenced by classic simulation games
