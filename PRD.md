# PRD: HVAC Scanner App

## 1. Visión del Producto

**HVAC Scanner** es una aplicación móvil que utiliza inteligencia artificial para digitalizar y analizar sistemas HVAC, permitiendo a técnicos e inspectores capturar información de etiquetas de equipos y detectar fallas potenciales a través de análisis visual.

## 2. Objetivos del Producto

### Objetivos Primarios
- Digitalizar información de etiquetas HVAC mediante OCR con IA
- Automatizar la detección de fallas en equipos HVAC
- Generar reportes y recomendaciones de mantenimiento
- Mejorar la eficiencia del proceso de inspección

### Objetivos Secundarios
- Crear una base de datos de equipos HVAC
- Facilitar el seguimiento histórico de mantenimientos
- Reducir errores humanos en la captura de datos

## 3. Audiencia Objetivo

### Usuarios Primarios
- Técnicos de HVAC
- Inspectores de mantenimiento
- Supervisores de instalaciones

### Usuarios Secundarios
- Administradores de edificios
- Empresas de servicios HVAC

## 4. Funcionalidades Principales

### 4.1 Escaneo de Etiquetas
- **Captura de Foto**: Tomar foto de la etiqueta del equipo HVAC
- **Extracción de Datos**: Usar OpenAI Vision para extraer:
  - Marca y modelo
  - Número de serie
  - Capacidad/BTU
  - Fecha de fabricación
  - Voltaje y amperaje
  - Refrigerante tipo
  - Eficiencia energética (SEER/EER)
- **Validación Manual**: Formulario para revisar y editar datos extraídos
- **Guardado**: Almacenar información en base de datos local

### 4.2 Inspección Visual de Equipos
- **Captura Múltiple**: Tomar una o varias fotos del equipo HVAC
- **Análisis de IA**: Usar OpenAI Vision para detectar:
  - Corrosión visible
  - Daños en serpentines
  - Fugas de refrigerante
  - Componentes faltantes o dañados
  - Problemas de suciedad/obstrucción
  - Estado de filtros
- **Recomendaciones**: Generar sugerencias de reparación/mantenimiento

### 4.3 Gestión de Reportes
- **Historial de Inspecciones**: Lista de equipos escaneados
- **Reportes Detallados**: Información completa por equipo
- **Exportación**: PDF y Excel de reportes
- **Búsqueda y Filtros**: Por fecha, equipo, estado

## 5. Flujo de Usuario

### Flujo Principal
1. **Inicio** → Pantalla principal con opciones
2. **Escanear Etiqueta** → Cámara para capturar etiqueta
3. **Validar Datos** → Formulario con datos extraídos
4. **Guardar** → Confirmar información del equipo
5. **Inspeccionar Equipo** → Cámara para fotos del equipo
6. **Análisis** → IA procesa imágenes
7. **Resultados** → Mostrar fallas detectadas y recomendaciones
8. **Reporte** → Generar y guardar reporte completo

### Flujos Secundarios
- Ver historial de inspecciones
- Editar información de equipos
- Exportar reportes
- Configuración de la app

## 6. Requisitos Técnicos

### Frontend
- **Framework**: Next.js 15 con TypeScript
- **UI**: Tailwind CSS, Mobile-first design
- **Cámara**: API nativa del navegador
- **Estado**: React Context/Redux
- **PWA**: Service Worker para uso offline

### Backend/APIs
- **OpenAI Vision API**: Análisis de imágenes
- **OpenAI GPT**: Generación de recomendaciones
- **Base de Datos**: SQLite local + IndexedDB
- **Almacenamiento**: Local Storage para imágenes

### Tecnologías Adicionales
- **Image Processing**: Canvas API para redimensionar
- **Export**: jsPDF para reportes PDF
- **Offline**: IndexedDB para funcionamiento sin conexión

## 7. Wireframes y UX

### Pantallas Principales
1. **Home**: Dashboard con acciones principales
2. **Scan Label**: Interfaz de cámara para etiquetas
3. **Data Form**: Formulario de validación de datos
4. **Inspect Equipment**: Cámara para inspección visual
5. **Results**: Análisis y recomendaciones
6. **History**: Lista de inspecciones realizadas
7. **Report Detail**: Vista detallada de cada reporte

### Principios de Diseño
- **Mobile First**: Optimizado para smartphones
- **Simplicidad**: Interfaz intuitiva y limpia
- **Accesibilidad**: Contraste adecuado, textos legibles
- **Performance**: Carga rápida y respuesta fluida

## 8. Métricas de Éxito

### KPIs Técnicos
- Precisión de OCR > 90%
- Tiempo de procesamiento < 5 segundos
- Tasa de error en detección < 5%

### KPIs de Usuario
- Tiempo promedio de inspección < 10 minutos
- Satisfacción del usuario > 4.5/5
- Adopción por técnicos > 80%

### KPIs de Negocio
- Reducción del tiempo de inspección en 50%
- Reducción de errores de captura en 70%
- Incremento en detección preventiva de fallas

## 9. Roadmap

### MVP (Fase 1) - 4 semanas
- Escaneo básico de etiquetas
- Formulario de validación
- Almacenamiento local
- Inspección visual básica

### Fase 2 - 2 semanas
- Análisis avanzado de fallas
- Sistema de recomendaciones
- Exportación de reportes
- Mejoras en UI/UX

### Fase 3 - 2 semanas
- Funcionalidad offline
- Sincronización en la nube
- Análisis histórico
- Optimizaciones de performance

## 10. Consideraciones de Implementación

### Seguridad
- Encriptación de datos sensibles
- Validación de entrada de usuario
- Manejo seguro de APIs keys

### Performance
- Optimización de imágenes
- Lazy loading de componentes
- Cache estratégico
- Compresión de datos

### Escalabilidad
- Arquitectura modular
- APIs desacopladas
- Base de datos flexible
- Deployment automatizado

---

**Fecha de Creación**: Julio 8, 2025  
**Versión**: 1.0  
**Estado**: En Desarrollo
