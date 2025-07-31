# Componentes de Estado de Cola

Este directorio contiene varios componentes para mostrar el estado de la cola en tiempo real en diferentes partes de la aplicación.

## 📋 Componentes Disponibles

### 1. `QueueStatusWidget`
Widget principal que muestra información detallada del estado de la cola.

#### Props:
- `variant`: `'compact' | 'detailed' | 'carousel'` (default: `'compact'`)
- `showUserTicket`: `boolean` - Muestra el ticket del usuario si está disponible
- `className`: `string` - Clases CSS adicionales

#### Ejemplos de uso:
```tsx
// Widget compacto para sidebar
<QueueStatusWidget variant="compact" showUserTicket={true} />

// Widget detallado para dashboard
<QueueStatusWidget variant="detailed" showUserTicket={true} />

// Widget con estilo carousel para landing pages
<QueueStatusWidget variant="carousel" showUserTicket={false} />
```

### 2. `QueueStatusBadge`
Badge pequeño optimizado para barras de navegación y espacios reducidos.

#### Props:
- `variant`: `'navbar' | 'floating' | 'sidebar'` (default: `'navbar'`)
- `showDetails`: `boolean` - Muestra información adicional
- `className`: `string` - Clases CSS adicionales
- `onClick`: `() => void` - Función callback al hacer clic

#### Ejemplos de uso:
```tsx
// Badge para navbar
<QueueStatusBadge variant="navbar" showDetails={false} />

// Badge flotante
<QueueStatusBadge variant="floating" />

// Badge para sidebar
<QueueStatusBadge variant="sidebar" showDetails={true} />
```

### 3. `FloatingQueueStatus`
Widget flotante que aparece automáticamente en ciertas rutas.

#### Props:
- `enabledRoutes`: `string[]` - Rutas donde aparece el widget
- `position`: `'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'`
- `autoShow`: `boolean` - Si se muestra automáticamente
- `defaultExpanded`: `boolean` - Si inicia expandido

#### Ejemplo de uso:
```tsx
<FloatingQueueStatus 
  enabledRoutes={['/about', '/home-user']}
  position="bottom-right"
  autoShow={true}
  defaultExpanded={false}
/>
```

### 4. `useQueueStatus` Hook
Hook personalizado para obtener datos del estado de la cola.

#### Opciones:
- `refreshInterval`: `number` - Intervalo de actualización en ms (default: 30000)
- `enableRealTime`: `boolean` - Habilita subscripciones en tiempo real
- `autoStart`: `boolean` - Inicia automáticamente

#### Ejemplo de uso:
```tsx
const {
  currentPriorityTicket,
  currentNormalTicket,
  userTicket,
  waitingCount,
  avgWaitTime,
  loading,
  error,
  refresh,
  hasActiveQueue
} = useQueueStatus({
  refreshInterval: 30000,
  enableRealTime: true
});
```

## 🎨 Variantes Visuales

### Compact
- Ideal para sidebars y espacios pequeños
- Muestra solo información esencial
- Incluye enlace a vista completa

### Detailed
- Perfecto para dashboards y páginas principales
- Muestra ticket del usuario, colas separadas y estadísticas
- Incluye animaciones y estados de carga

### Carousel
- Diseñado para landing pages y presentaciones
- Gradiente atractivo y tipografía destacada
- Información condensada pero visualmente impactante

### Navbar
- Optimizado para barras de navegación
- Muy compacto, solo muestra tickets actuales
- Indicador de conexión en tiempo real

### Floating
- Widget flotante posicionable
- Expandible/colapsable
- Aparece automáticamente en rutas específicas

## 🔄 Funcionalidades en Tiempo Real

Todos los componentes incluyen:
- **Subscripciones en tiempo real**: Actualizaciones automáticas via Supabase
- **Animaciones**: Feedback visual cuando cambian los tickets
- **Polling de respaldo**: Actualización por intervalo si falla tiempo real
- **Estados de carga**: Indicadores mientras se cargan los datos
- **Manejo de errores**: Mensajes informativos en caso de fallo

## 📍 Integración en la Aplicación

### Navbar
```tsx
// Ya integrado en src/pages/navbar/navbar.tsx
<QueueStatusBadge variant="navbar" showDetails={false} />
```

### Landing Page
```tsx
// Ya integrado en src/pages/GlobalHome/GlobalHome.tsx
<QueueStatusWidget variant="carousel" />
<QueueStatusWidget variant="detailed" />
```

### App Level
```tsx
// Ya integrado en src/App.tsx
<FloatingQueueStatus 
  enabledRoutes={['/about', '/home-user', '/personal-data']}
/>
```

## 🛠️ Personalización

### CSS Classes
Todos los componentes aceptan `className` para personalización:
```tsx
<QueueStatusWidget 
  variant="compact" 
  className="custom-styling border-blue-500"
/>
```

### Tema
Los componentes usan Tailwind CSS y siguen el sistema de colores:
- **Prioritario**: Rojo (`red-500`, `red-600`, etc.)
- **Normal**: Azul (`blue-500`, `blue-600`, etc.)
- **Usuario**: Púrpura (`purple-500`, `purple-600`, etc.)
- **Éxito**: Verde (`green-500`)
- **Error**: Rojo (`red-500`)

## 🚀 Performance

- **Lazy Loading**: Los componentes solo cargan datos cuando se montan
- **Memoización**: Evita re-renders innecesarios
- **Debounced Updates**: Las animaciones no se acumulan
- **Cleanup**: Limpieza automática de subscripciones y timers xx