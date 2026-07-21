import React, { useState, useEffect, useRef } from 'react';
import Tree from 'react-d3-tree';
import { 
  Folder, 
  MapPin, 
  FileText, 
  Plus, 
  Search, 
  Settings, 
  Layers, 
  QrCode, 
  Download,
  Share2,
  Trash2,
  Activity,
  Upload,
  Eye,
  X,
  PieChart,
  FileCheck,
  Lock,
  User,
  LogOut,
  Clock,
  FileSpreadsheet,
  ChevronRight,
  ChevronDown,
  ChevronsRight,
  Minimize2,
  FileCode,
  Image,
  FileWarning,
  ChevronLeft,
  AlertTriangle,
  Users,
  Sliders,
  Palette,
  ArrowRight,
  Camera,
  UserPlus,
  Key,
  FolderOpen,
  Cpu,
  HelpCircle,
  Database
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userRol, setUserRol] = useState(localStorage.getItem('userRol') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Control de cambio de contraseña obligatorio por primer ingreso
  const [showChangePasswordPanel, setShowChangePasswordPanel] = useState(false);
  const [tempTokenData, setTempTokenData] = useState(null); // Almacena temporalmente el token del login antes del cambio
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [confirmPasswordVal, setConfirmPasswordVal] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');

  // Menú Activo ('dashboard' | 'jerarquias' | 'workflow' | 'usuarios' | 'auditoria')
  const [activeMenu, setActiveMenu] = useState('dashboard');

  // Datos de Jerarquía y Documentos
  const [treeData, setTreeData] = useState(null);
  const [treeKey, setTreeKey] = useState(0); 
  const [selectedNode, setSelectedNode] = useState(null);
  const [documents, setDocuments] = useState([]);

  // Control de Vista del Canvas Central en Jerarquías ('grafico' o 'linux')
  const [activeView, setActiveView] = useState('grafico');

  // Estados de Colapso de Paneles Laterales
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // Estado de Colapso de Nodos en el Nav de Estructura Compacta (Izquierdo)
  const [localExpanded, setLocalExpanded] = useState({});

  // Lista de Estados y Transiciones de Workflow del Backend
  const [estados, setEstados] = useState([]);
  const [transiciones, setTransiciones] = useState([]);

  // Lista de Usuarios para la vista de RBAC
  const [usuarios, setUsuarios] = useState([]);

  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAddEstadoModal, setShowAddEstadoModal] = useState(false);

  // Formulario de Nuevo Estado
  const [newEstadoNombre, setNewEstadoNombre] = useState('');
  const [newEstadoColor, setNewEstadoColor] = useState('#a855f7');
  const [newEstadoSecuencia, setNewEstadoSecuencia] = useState(1);
  const [newEstadoAplicaA, setNewEstadoAplicaA] = useState('ambos'); // "categoria", "archivo", "ambos"
  const [activeTooltip, setActiveTooltip] = useState(null); // 'nombre', 'aplicaA', 'color', 'secuencia'

  // Formulario de Nueva Transición
  const [fromEstadoId, setFromEstadoId] = useState('');
  const [toEstadoId, setToEstadoId] = useState('');

  // Modal de Confirmación Custom (Elegante y Neón)
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    requireTextConfirm: false,
    inputValue: '',
    onConfirm: null
  });

  // Preferencias de Personalización y Accesibilidad del Sistema
  const [prefTemaColor, setPrefTemaColor] = useState(localStorage.getItem('pref_tema_color') || 'cyberpunk');
  const [prefTipoFuente, setPrefTipoFuente] = useState(localStorage.getItem('pref_tipo_fuente') || 'Outfit');
  const [prefEfectosGlow, setPrefEfectosGlow] = useState(localStorage.getItem('pref_efectos_glow') !== 'false');
  const [prefSonidoQR, setPrefSonidoQR] = useState(localStorage.getItem('pref_sonido_qr') !== 'false');

  // Restablecimiento del Sistema (Zona de Peligro)
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  // Copias de Seguridad y Usabilidad Jerárquica
  const [backups, setBackups] = useState([]);
  const [backupTipo, setBackupTipo] = useState('total');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [linuxCollapsedNodes, setLinuxCollapsedNodes] = useState({});
  
  // Búsquedas
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filterEstado, setFilterEstado] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [filterPersona, setFilterPersona] = useState('');
  const [showFiltrosPanel, setShowFiltrosPanel] = useState(false);
  
  // Buscador de logs
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Formulario de Nodo
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeAbbreviation, setNewNodeAbbreviation] = useState('');
  const [isPhysicalLocation, setIsPhysicalLocation] = useState(false);
  const [addParentNode, setAddParentNode] = useState(null);
  const [addParentSearchQuery, setAddParentSearchQuery] = useState('');
  const [addParentSearchResults, setAddParentSearchResults] = useState([]);
  const [nodeImageFile, setNodeImageFile] = useState(null);
  const [newNodeRetentionMonths, setNewNodeRetentionMonths] = useState('');
  const [newNodeTransferDestinationId, setNewNodeTransferDestinationId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Catálogo de Personas y Directorio
  const [personas, setPersonas] = useState([]);
  const [activeUsuariosTab, setActiveUsuariosTab] = useState('roles'); // 'roles' | 'directorio'
  
  // Catálogo de Roles Organizacionales Dinámicos
  const [rolesOrganizacion, setRolesOrganizacion] = useState([]);
  const [showRolesConfigModal, setShowRolesConfigModal] = useState(false);
  const [newRolNombre, setNewRolNombre] = useState('');
  const [newRolCodigo, setNewRolCodigo] = useState('');
  const [newRolColor, setNewRolColor] = useState('#3b82f6');

  // Modal Crear Persona
  const [showCreatePersonaModal, setShowCreatePersonaModal] = useState(false);
  const [newPersonaIdentificacion, setNewPersonaIdentificacion] = useState('');
  const [newPersonaNombre, setNewPersonaNombre] = useState('');
  const [newPersonaRolId, setNewPersonaRolId] = useState('');
  const [newPersonaCarrera, setNewPersonaCarrera] = useState('');
  const [newPersonaCrearUsuario, setNewPersonaCrearUsuario] = useState(false);
  const [newPersonaUsername, setNewPersonaUsername] = useState('');
  const [newPersonaPassword, setNewPersonaPassword] = useState('');
  
  // Modal Expediente Consolidado
  const [showExpedienteModal, setShowExpedienteModal] = useState(false);
  const [selectedPersonaExpediente, setSelectedPersonaExpediente] = useState(null);
  
  // Modal Vincular Persona a Activo
  const [showLinkPersonaModal, setShowLinkPersonaModal] = useState(false);
  const [linkPersonaSearchQuery, setLinkPersonaSearchQuery] = useState('');
  const [linkPersonaSearchResults, setLinkPersonaSearchResults] = useState([]);
  const [selectedLinkPersona, setSelectedLinkPersona] = useState(null);
  const [linkPersonaRolMomentoId, setLinkPersonaRolMomentoId] = useState('');
  const [linkPersonaTipoRelacion, setLinkPersonaTipoRelacion] = useState('Propietario');
  const [linkPersonaPeso, setLinkPersonaPeso] = useState(5); // Peso de relevancia
  
  // Modal Crear Enlace Cruzado (Shortcut)
  const [showLinkCruzadoModal, setShowLinkCruzadoModal] = useState(false);
  const [linkCruzadoSearchQuery, setLinkCruzadoSearchQuery] = useState('');
  const [linkCruzadoSearchResults, setLinkCruzadoSearchResults] = useState([]);
  const [selectedLinkCruzadoNode, setSelectedLinkCruzadoNode] = useState(null);

  // Destino de vínculos
  const [linkTargetType, setLinkTargetType] = useState('nodo'); // 'nodo' | 'documento'
  const [linkTargetId, setLinkTargetId] = useState(null);
  const [linkTargetName, setLinkTargetName] = useState('');

  // Permisos de categoría
  const [permisosNodo, setPermisosNodo] = useState([]);
  const [selectedPermisoDestinatarioType, setSelectedPermisoDestinatarioType] = useState('usuario'); // 'usuario' | 'rol'
  const [selectedPermisoUsuarioId, setSelectedPermisoUsuarioId] = useState('');
  const [selectedPermisoRolId, setSelectedPermisoRolId] = useState('');
  const [selectedPermisoTipo, setSelectedPermisoTipo] = useState('lectura');

  // Vistas guardadas de usuario
  const [vistasGuardadas, setVistasGuardadas] = useState([]);
  const [selectedVistaId, setSelectedVistaId] = useState('');
  const [showSaveVistaModal, setShowSaveVistaModal] = useState(false);
  const [newVistaName, setNewVistaName] = useState('');
  const [reportesEstadisticas, setReportesEstadisticas] = useState(null);

  // Modal de Escaneo
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerSource, setScannerSource] = useState('twain'); // 'camera' | 'twain'
  const [scannerCameraStream, setScannerCameraStream] = useState(null);
  const [scannedImage, setScannedImage] = useState(null); // Base64 o URL
  const [isScanningAnim, setIsScanningAnim] = useState(false); // Animación de escaneo
  const [scanProgress, setScanProgress] = useState(0); // Progreso de emulador TWAIN
  
  // Datos del archivo escaneado a subir
  const [scannedFileName, setScannedFileName] = useState('Documento_Escaneado_XF.pdf');
  const [scannedLogicalNodeId, setScannedLogicalNodeId] = useState('');
  const [scannedPhysicalNodeId, setScannedPhysicalNodeId] = useState('');
  const [scannedLinkPersona, setScannedLinkPersona] = useState(null);
  const [scannedLinkPersonaQuery, setScannedLinkPersonaQuery] = useState('');
  const [scannedLinkPersonaSearchResults, setScannedLinkPersonaSearchResults] = useState([]);
  const [scannedLinkPersonaRelacion, setScannedLinkPersonaRelacion] = useState('Firmante');
  const [scannedLinkPersonaPeso, setScannedLinkPersonaPeso] = useState(5);
  const [scannedLinkPersonaRolMomentoId, setScannedLinkPersonaRolMomentoId] = useState('');

  // Estados de previsualización
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewFileUrl, setPreviewFileUrl] = useState('');
  const [previewFileType, setPreviewFileType] = useState(''); 
  
  // Datos Globales del Dashboard y Auditoría
  const [statsData, setStatsData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [alertasRetencion, setAlertasRetencion] = useState([]);
  
  // Drag over states
  const [dragOverNodeCode, setDragOverNodeCode] = useState(null);
  const [isRightDragOver, setIsRightDragOver] = useState(false);
  
  // Referencias para inputs files
  const fileInputRef = useRef(null);
  const nodeSpecificUploadRef = useRef(null);
  const [newEtiquetaInput, setNewEtiquetaInput] = useState('');
  
  // Estados para Módulo de Codificación
  const [configCodificacion, setConfigCodificacion] = useState({
    separador: '-',
    digitos_correlativo: 3,
    usar_abreviacion_padre: true,
    prefijo_global: ''
  });
  const [manualCodigoInput, setManualCodigoInput] = useState('');
  const [isManualCodigoActive, setIsManualCodigoActive] = useState(false);

  // Estado de Movimiento / Re-ubicación
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveTargetId, setMoveTargetId] = useState('');
  const [moveElementType, setMoveElementType] = useState('nodo'); // 'nodo' | 'documento'
  const [moveElementId, setMoveElementId] = useState(null);
  const [moveElementName, setMoveElementName] = useState('');
  const [moveElementIsPhysical, setMoveElementIsPhysical] = useState(false);
  const [moveFileTypeSelect, setMoveFileTypeSelect] = useState('logico'); // 'logico' | 'fisico'
  const [tipoJerarquia, setTipoJerarquia] = useState('logico'); // 'logico' | 'fisico'

  const getDestinosElegibles = (nodos, esFisicoTarget) => {
    const lista = [];
    const aplanar = (node) => {
      if (node.attributes?.es_ubicacion_fisica !== esFisicoTarget) {
        if (node.children) {
          node.children.forEach(aplanar);
        }
        return;
      }
      
      if (moveElementType === 'nodo' && node.attributes?.id === moveElementId) {
        return;
      }

      lista.push({ id: node.attributes?.id, nombre: node.name, codigo: node.attributes?.codigo });
      if (node.children) {
        node.children.forEach(aplanar);
      }
    };
    if (nodos) aplanar(nodos);
    return lista;
  };

  const handleMoveElement = async (e) => {
    e.preventDefault();
    if (!moveElementId || !moveTargetId) return;

    const url = moveElementType === 'nodo'
      ? `${API_BASE_URL}/nodos/${moveElementId}/mover?nuevo_parent_id=${moveTargetId}`
      : `${API_BASE_URL}/documentos/${moveElementId}/mover?nuevo_nodo_id=${moveTargetId}`;

    try {
      setIsLoading(true);
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setShowMoveModal(false);
        setMoveTargetId('');
        await fetchTreeData();
        setTreeKey(prev => prev + 1);
        if (selectedNode) {
          if (moveElementType === 'nodo' && moveElementId === selectedNode.attributes?.id) {
            setSelectedNode(null);
          } else {
            await fetchDocuments(selectedNode.attributes.id);
          }
        }
        triggerNotification("Re-ubicación Completada", "El elemento fue movido y se recalcularon códigos inteligentes en cascada.");
      } else {
        const errData = await res.json();
        triggerNotification("Error al mover", errData.detail || 'No se pudo mover el elemento', "error");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Error de Red", "Error de red al mover el elemento.", "error");
    } finally {
      setIsLoading(false);
    }
  };


  // Estado de Notificación Flotante
  const [notification, setNotification] = useState({ show: false, title: '', message: '', tipo: 'info' });

  const triggerNotification = (title, message, tipo = 'info') => {
    setNotification({ show: true, title, message, tipo });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 4500);
  };

  // Borrar Categoría / Nodo DMS
  const handleDeleteNodeClick = () => {
    if (!selectedNode || userRol !== 'admin') return;

    // Verificar si tiene subcarpetas o documentos cargados
    const tieneHijos = selectedNode.children && selectedNode.children.length > 0;
    const tieneDocumentos = documents && documents.length > 0;
    const requiereConfirmacionDoble = tieneHijos || tieneDocumentos;

    setConfirmModal({
      show: true,
      title: requiereConfirmacionDoble ? '¡BORRADO DE ALTO RIESGO!' : 'Eliminar Categoría Lógica',
      message: requiereConfirmacionDoble 
        ? `La categoría "${selectedNode.name}" contiene subcarpetas o documentos en la nube. Borrarla eliminará permanentemente TODO su contenido en cascada. Para confirmar, escribe la palabra clave "ELIMINAR" abajo.`
        : `¿Confirmas que deseas eliminar la categoría "${selectedNode.name}"? Esta acción no se puede deshacer.`,
      requireTextConfirm: requiereConfirmacionDoble,
      inputValue: '',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          const res = await fetch(`${API_BASE_URL}/nodos/${selectedNode.attributes.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            setSelectedNode(null);
            await fetchTreeData();
            setTreeKey(prev => prev + 1);
            setConfirmModal(prev => ({ ...prev, show: false }));
            triggerNotification("Categoría Eliminada", "El nodo y sus descendientes han sido purgados de PostgreSQL.");
          } else {
            const errData = await res.json();
            triggerNotification("Error al Eliminar", errData.detail || "Operación fallida", "error");
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // Borrar Documento DMS
  const handleDeleteDocumentClick = (e, doc) => {
    e.stopPropagation();
    if (userRol !== 'admin') return;

    setConfirmModal({
      show: true,
      title: 'Eliminar Archivo del DMS',
      message: `¿Estás seguro de que deseas purgar permanentemente el archivo "${doc.nombre_archivo}" del servidor de nube y la base de datos?`,
      requireTextConfirm: false,
      inputValue: '',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          const res = await fetch(`${API_BASE_URL}/documentos/${doc.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            if (selectedNode && selectedNode.attributes?.id) {
              await fetchDocuments(selectedNode.attributes.id);
            }
            await fetchTreeData();
            setTreeKey(prev => prev + 1);
            setConfirmModal(prev => ({ ...prev, show: false }));
            triggerNotification("Archivo Purgado", "El documento ha sido eliminado con éxito de la nube.");
          } else {
            const errData = await res.json();
            triggerNotification("Error al Purgar", errData.detail || "No se pudo eliminar el archivo", "error");
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // Render Compact Tree (Nav Lateral Izquierdo)
  const renderCompactTree = (node, depth = 0) => {
    const isExpanded = localExpanded[node.attributes?.codigo] ?? false;
    const isSelected = selectedNode?.attributes?.codigo === node.attributes?.codigo;
    const tieneHijos = node.children && node.children.length > 0;
    const isArchivo = node.attributes?.es_archivo || node.attributes?.tipo === 'Archivo DMS';
    
    return (
      <div key={node.attributes?.codigo} style={{ display: 'flex', flexDirection: 'column' }}>
        <div 
          onClick={() => {
            if (isArchivo) {
              setPreviewFileName(node.name);
              setPreviewFileUrl(`${API_BASE_URL}${node.attributes.ruta}`);
              const ext = node.name.split('.').pop().toLowerCase();
              if (ext === 'pdf') setPreviewFileType('pdf');
              else if (['doc','docx','xls','xlsx'].includes(ext)) setPreviewFileType('office');
              else if (['png','jpg','jpeg','gif'].includes(ext)) setPreviewFileType('image');
              else setPreviewFileType('generic');
              setShowPreviewModal(true);
            } else {
              setSelectedNode(node);
            }
          }}
          className="hover-scale"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 8px',
            paddingLeft: `${12 + depth * 14}px`,
            borderRadius: '6px',
            cursor: 'pointer',
            background: isSelected ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
            border: isSelected ? '1px solid rgba(168, 85, 247, 0.2)' : '1px solid transparent',
            color: isSelected ? '#fff' : '#cbd5e1'
          }}
        >
          {tieneHijos ? (
            <span 
              onClick={(e) => {
                e.stopPropagation();
                toggleLocalNode(node.attributes?.codigo);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#8f9cae' }}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          ) : (
            <div style={{ width: '14px' }} />
          )}

          {isArchivo ? (
            <FileText size={14} color="#ef4444" style={{ minWidth: '14px' }} />
          ) : node.attributes?.es_ubicacion_fisica ? (
            <MapPin size={14} color="#22c55e" style={{ minWidth: '14px' }} />
          ) : (
            <Folder size={14} color="#c084fc" style={{ minWidth: '14px' }} />
          )}

          <span style={{ fontSize: '12px', fontWeight: isSelected ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {node.name}
          </span>

          {node.attributes?.estado_color && (
            <div 
              style={{ 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                background: node.attributes.estado_color,
                boxShadow: `0 0 6px ${node.attributes.estado_color}`
              }} 
              title={`Estado: ${node.attributes.estado_nombre}`}
            />
          )}
        </div>

        {tieneHijos && isExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {node.children.map(child => renderCompactTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render Linux Style Tree (Vista Linux central)
  const renderLinuxStyleTree = (node, prefix = '', isLast = true, isRoot = true) => {
    const isSelected = selectedNode?.attributes?.codigo === node.attributes?.codigo;
    const tieneHijos = node.children && node.children.length > 0;
    const isArchivo = node.attributes?.es_archivo || node.attributes?.tipo === 'Archivo DMS';
    const isCollapsed = !!linuxCollapsedNodes[node.attributes?.codigo];
    const hasAlert = node.attributes?.id && alertasRetencion.some(alerta => alerta.ubicacion_fisica?.id === node.attributes.id);
    
    const connector = isRoot ? '' : (isLast ? '└── ' : '├── ');
    const nextPrefix = isRoot ? '' : (isLast ? prefix + '    ' : prefix + '│   ');

    return (
      <div key={node.attributes?.codigo} style={{ display: 'flex', flexDirection: 'column', fontFamily: 'monospace', fontSize: '13px' }}>
        <div 
          onClick={() => {
            if (isArchivo) {
              setPreviewFileName(node.name);
              setPreviewFileUrl(`${API_BASE_URL}${node.attributes.ruta}`);
              const ext = node.name.split('.').pop().toLowerCase();
              if (ext === 'pdf') setPreviewFileType('pdf');
              else if (['doc','docx','xls','xlsx'].includes(ext)) setPreviewFileType('office');
              else if (['png','jpg','jpeg','gif'].includes(ext)) setPreviewFileType('image');
              else setPreviewFileType('generic');
              setShowPreviewModal(true);
            } else {
              setSelectedNode(node);
              setIsRightCollapsed(false);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 8px',
            cursor: 'pointer',
            background: isSelected ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
            borderRadius: '4px',
            color: isSelected ? '#fff' : '#cbd5e1',
            whiteSpace: 'pre'
          }}
          className={`hover-scale ${hasAlert ? 'retencion-alerta-blink' : ''}`}
        >
          <span style={{ color: '#475569' }}>{prefix}{connector}</span>
          
          {/* Indicador de Despliegue interactivo para carpetas lógicas/físicas */}
          {tieneHijos && (
            <span 
              onClick={(e) => {
                e.stopPropagation();
                setLinuxCollapsedNodes(prev => ({
                  ...prev,
                  [node.attributes?.codigo]: !prev[node.attributes?.codigo]
                }));
              }}
              style={{ color: '#06b6d4', paddingRight: '4px', cursor: 'pointer', userSelect: 'none', fontWeight: 'bold' }}
            >
              {isCollapsed ? '▶' : '▼'}
            </span>
          )}
          
          {isArchivo ? (
            <FileText size={14} color="#ef4444" style={{ minWidth: '14px' }} />
          ) : hasAlert ? (
            <AlertTriangle size={14} color="#ef4444" className="retencion-alerta-blink" style={{ minWidth: '14px' }} />
          ) : node.attributes?.es_ubicacion_fisica ? (
            <MapPin size={14} color="#22c55e" style={{ minWidth: '14px' }} />
          ) : (
            <Folder size={14} color="#c084fc" style={{ minWidth: '14px' }} />
          )}
          <span style={{ fontWeight: isSelected ? 'bold' : 'normal', color: hasAlert ? '#ef4444' : (isArchivo ? '#cbd5e1' : (node.attributes?.es_ubicacion_fisica ? '#22c55e' : '#fff')) }}>
            {node.name}
          </span>
          <span style={{ color: '#8f9cae', fontSize: '10px' }}>({node.attributes?.codigo})</span>

          {node.attributes?.estado_nombre && (
            <span 
              style={{ 
                fontSize: '8px', 
                border: `1px solid ${node.attributes.estado_color}`, 
                color: node.attributes.estado_color, 
                padding: '1px 5px', 
                borderRadius: '3px', 
                marginLeft: '8px',
                fontFamily: 'Outfit'
              }}
            >
              {node.attributes.estado_nombre}
            </span>
          )}
        </div>

        {tieneHijos && !isCollapsed && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {node.children.map((child, index) => 
              renderLinuxStyleTree(child, nextPrefix, index === node.children.length - 1, false)
            )}
          </div>
        )}
      </div>
    );
  };

  // Render Custom Node (D3 Tree)
  const renderCustomNode = ({ nodeDatum, toggleNode }) => {
    const isSelected = selectedNode?.attributes?.codigo === nodeDatum.attributes?.codigo;
    const tieneHijos = nodeDatum.children && nodeDatum.children.length > 0;
    const borderColor = nodeDatum.attributes?.estado_color || '#a855f7';
    const isPhysical = nodeDatum.attributes?.es_ubicacion_fisica;
    const isArchivo = nodeDatum.attributes?.es_archivo || nodeDatum.attributes?.tipo === 'Archivo DMS';
    const hasAlert = nodeDatum.attributes?.id && alertasRetencion.some(alerta => alerta.ubicacion_fisica?.id === nodeDatum.attributes.id);

    return (
      <g>
        <defs>
          <linearGradient id="link-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        <foreignObject 
          width="240" 
          height="85" 
          x="-120" 
          y="-42"
        >
          <div 
            onClick={() => {
              if (isArchivo) {
                setPreviewFileName(nodeDatum.name);
                setPreviewFileUrl(`${API_BASE_URL}${nodeDatum.attributes.ruta}`);
                const ext = nodeDatum.name.split('.').pop().toLowerCase();
                if (ext === 'pdf') setPreviewFileType('pdf');
                else if (['doc','docx','xls','xlsx'].includes(ext)) setPreviewFileType('office');
                else if (['png','jpg','jpeg','gif'].includes(ext)) setPreviewFileType('image');
                else setPreviewFileType('generic');
                setShowPreviewModal(true);
              } else {
                setSelectedNode(nodeDatum);
                setIsRightCollapsed(false);
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (userRol === 'admin' && !isArchivo) {
                setDragOverNodeCode(nodeDatum.attributes?.codigo);
              }
            }}
            onDragLeave={() => setDragOverNodeCode(null)}
            onDrop={(e) => {
              if (!isArchivo) handleDropFileOnNode(e, nodeDatum);
            }}
            className={`glass-card ${hasAlert ? 'retencion-alerta-blink' : ''}`}
            style={{
              width: '100%',
              height: '100%',
              padding: '10px 14px',
              borderRadius: '12px',
              border: dragOverNodeCode === nodeDatum.attributes?.codigo
                ? '2.5px solid #22c55e'
                : hasAlert
                  ? '1.5px solid #ef4444'
                  : `1.5px solid ${isSelected ? '#c084fc' : (isArchivo ? 'rgba(239, 68, 68, 0.4)' : `${borderColor}33`)}`,
              boxShadow: dragOverNodeCode === nodeDatum.attributes?.codigo
                ? '0 0 20px rgba(34, 197, 94, 0.4)'
                : hasAlert
                  ? '0 0 15px rgba(239, 68, 68, 0.45)'
                  : (isSelected ? '0 0 15px rgba(168, 85, 247, 0.25)' : 'none'),
              background: '#0a0d17',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                {isArchivo ? (
                  <FileText size={14} color="#ef4444" style={{ minWidth: '14px' }} />
                ) : hasAlert ? (
                  <AlertTriangle size={14} color="#ef4444" className="retencion-alerta-blink" style={{ minWidth: '14px' }} />
                ) : isPhysical ? (
                  <MapPin size={14} color="#22c55e" style={{ minWidth: '14px' }} />
                ) : (
                  <Folder size={14} color="#c084fc" style={{ minWidth: '14px' }} />
                )}
                <span 
                  style={{ 
                    fontSize: '11px', 
                    fontWeight: 600, 
                    color: '#fff', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap',
                    maxWidth: '130px'
                  }}
                >
                  {nodeDatum.name}
                </span>
              </div>

              {nodeDatum.attributes?.estado_nombre && (
                <span 
                  style={{ 
                    fontSize: '8px', 
                    border: `1px solid ${nodeDatum.attributes.estado_color}`, 
                    color: nodeDatum.attributes.estado_color, 
                    padding: '1px 5px', 
                    borderRadius: '4px',
                    fontWeight: 700
                  }}
                >
                  {nodeDatum.attributes.estado_nombre}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '6px' }}>
              <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#8f9cae' }}>{nodeDatum.attributes?.codigo}</span>
              
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                {userRol === 'admin' && !isArchivo && (
                  <span 
                    onClick={(e) => handleNodeCardUploadClick(e, nodeDatum.attributes.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                    title="Registrar Archivo"
                  >
                    <Upload size={11} color="#22c55e" />
                  </span>
                )}
                {tieneHijos && (
                  <span 
                    onClick={() => {
                      const nodeId = nodeDatum.attributes?.id;
                      if (nodeId) {
                        let expandidos = [];
                        try {
                          expandidos = JSON.parse(localStorage.getItem(`pref_arbol_expandidos_${tipoJerarquia}`) || '[]');
                        } catch(e) {}
                        if (nodeDatum._collapsed) {
                          if (!expandidos.includes(nodeId)) expandidos.push(nodeId);
                        } else {
                          expandidos = expandidos.filter(id => id !== nodeId);
                        }
                        localStorage.setItem(`pref_arbol_expandidos_${tipoJerarquia}`, JSON.stringify(expandidos));
                      }
                      toggleNode();
                    }}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      padding: '2px', 
                      color: '#c084fc', 
                      display: 'flex', 
                      alignItems: 'center' 
                    }}
                  >
                    {nodeDatum._collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  </span>
                )}
              </div>
            </div>
          </div>
        </foreignObject>
      </g>
    );
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const formData = new URLSearchParams();
      formData.append('username', loginUser);
      formData.append('password', loginPass);

      const res = await fetch(`${API_BASE_URL}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (data.debe_cambiar_password) {
          setTempTokenData(data);
          setShowChangePasswordPanel(true);
          setLoginUser('');
          setLoginPass('');
        } else {
          setToken(data.access_token);
          setUserRol(data.rol);
          setUsername(data.username);
          
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('userRol', data.rol);
          localStorage.setItem('username', data.username);
          
          setLoginUser('');
          setLoginPass('');
        }
      } else {
        const errData = await res.json();
        setLoginError(errData.detail || 'Credenciales inválidas.');
      }
    } catch (err) {
      setLoginError('Error de red al conectar con el servidor.');
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setChangePasswordError('');
    if (newPasswordVal.trim() !== confirmPasswordVal.trim()) {
      setChangePasswordError('Las contraseñas no coinciden.');
      return;
    }
    if (newPasswordVal.trim().length < 4) {
      setChangePasswordError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/usuarios/cambiar-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempTokenData.access_token}`
        },
        body: JSON.stringify({ new_password: newPasswordVal.trim() })
      });

      if (res.ok) {
        // Guardar credenciales de sesión normales
        setToken(tempTokenData.access_token);
        setUserRol(tempTokenData.rol);
        setUsername(tempTokenData.username);
        
        localStorage.setItem('token', tempTokenData.access_token);
        localStorage.setItem('userRol', tempTokenData.rol);
        localStorage.setItem('username', tempTokenData.username);

        // Limpiar
        setTempTokenData(null);
        setShowChangePasswordPanel(false);
        setNewPasswordVal('');
        setConfirmPasswordVal('');
        triggerNotification("Contraseña Actualizada", "Ingreso concedido con éxito.");
      } else {
        const errData = await res.json();
        setChangePasswordError(errData.detail || 'No se pudo actualizar la contraseña.');
      }
    } catch (err) {
      setChangePasswordError('Error al conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReportesEstadisticas = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/reportes/estadisticas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReportesEstadisticas(data);
      } else {
        triggerNotification("Error de Reportes", "No se pudieron cargar los datos estadísticos.", "error");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Error de Conexión", "Error de red al obtener reportes.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUserRol('');
    setUsername('');
    localStorage.removeItem('token');
    localStorage.removeItem('userRol');
    localStorage.removeItem('username');
    setSelectedNode(null);
    setTreeData(null);
  };

  const handleSessionExpired = () => {
    setToken('');
    setUserRol('');
    setUsername('');
    localStorage.removeItem('token');
    localStorage.removeItem('userRol');
    localStorage.removeItem('username');
    setSelectedNode(null);
    setTreeData(null);
    triggerNotification("Sesión Expirada", "Su token es inválido o la base de datos fue restablecida. Por favor, inicie sesión de nuevo.");
  };


  // 1. Cargar el árbol desde el backend
  const fetchTreeData = async (tipo = tipoJerarquia) => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/nodos/arbol?tipo=${tipo}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleSessionExpired();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        
        const inicializarColapsos = (node) => {
          const nodeId = node.attributes?.id;
          let expandidos = [];
          try {
            const guardadosRaw = JSON.parse(localStorage.getItem(`pref_arbol_expandidos_guardados_${tipo}`) || '[]');
            expandidos = guardadosRaw.map(x => String(typeof x === 'object' ? x.id : x));
            if (expandidos.length === 0) {
              const expandidosTemp = JSON.parse(localStorage.getItem(`pref_arbol_expandidos_${tipo}`) || '[]');
              expandidos = expandidosTemp.map(String);
            }
          } catch(e) {}
          const esRaiz = !nodeId;
          const isExpanded = esRaiz || expandidos.includes(String(nodeId));
          const updated = { ...node, _collapsed: !isExpanded }; 
          if (node.children) {
            updated.children = node.children.map(inicializarColapsos);
          }
          return updated;
        };

        const parsedData = inicializarColapsos(data);
        setTreeData(parsedData);
        setTreeKey(prev => prev + 1); // Forzar la recreación del árbol D3 con el nuevo estado de colapsos

        // Sincronizar automáticamente el estado de colapsos de la consola de comandos
        try {
          let expandidosInt = [];
          const guardadosRaw = JSON.parse(localStorage.getItem(`pref_arbol_expandidos_guardados_${tipo}`) || '[]');
          expandidosInt = guardadosRaw.map(x => parseInt(typeof x === 'object' ? x.id : x));
          if (expandidosInt.length === 0) {
            const expandidosTemp = JSON.parse(localStorage.getItem(`pref_arbol_expandidos_${tipo}`) || '[]');
            expandidosInt = expandidosTemp.map(x => parseInt(x));
          }

          const colapsos = {};
          const recorrerConsola = (node) => {
            const id = node.attributes?.id;
            const codigo = node.attributes?.codigo;
            if (id && codigo) {
              const esRaiz = !id;
              if (!esRaiz) {
                colapsos[codigo] = !expandidosInt.includes(parseInt(id));
              }
            }
            if (node.children) {
              node.children.forEach(recorrerConsola);
            }
          };
          recorrerConsola(data);
          setLinuxCollapsedNodes(colapsos);
        } catch (e) {
          console.error("Error al sincronizar colapsos de la consola:", e);
        }
        
        if (!selectedNode && Object.keys(data).length > 0) {
          setSelectedNode(parsedData);
        }
      }
    } catch (err) {
      console.error("Error al conectar con la API de Archi-vite:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- RESTABLECER EL SISTEMA (ZONA DE PELIGRO) ---
  const handleResetSistema = async () => {
    if (resetConfirmText !== 'INICIALIZAR-SISTEMA') return;
    
    try {
      setIsResetting(true);
      const res = await fetch(`${API_BASE_URL}/sistema/resetear`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setShowResetConfirmModal(false);
        triggerNotification("Sistema Restablecido", "La base de datos y archivos han sido inicializados.");
        setTimeout(() => {
          window.location.reload();
        }, 1800);
      } else {
        const errorData = await res.json();
        triggerNotification("Error de Restablecimiento", errorData.detail || "No se pudo validar las credenciales de seguridad.");
      }
    } catch (err) {
      console.error("Error al resetear el sistema:", err);
      triggerNotification("Error de Conexión", "No se pudo conectar con el servidor.");
    } finally {
      setIsResetting(false);
    }
  };

  // --- GUARDAR DESPLIEGUE PERSONALIZADO DEL ÁRBOL ---
  const handleGuardarVistaArbol = () => {
    if (!treeData) {
      triggerNotification("Error de Vista", "No hay datos cargados en el árbol para guardar.");
      return;
    }

    const expandidos = [];
    const mapaNodos = {};
    const recorrerNodos = (node) => {
      const id = node.attributes?.id;
      if (id) {
        mapaNodos[id] = {
          nombre: node.name,
          tipo: node.attributes?.es_ubicacion_fisica ? 'Física' : 'Lógica',
          codigo: node.attributes?.codigo
        };
      }
      if (node.children) {
        node.children.forEach(recorrerNodos);
      }
    };
    recorrerNodos(treeData);

    if (activeView === 'linux') {
      Object.keys(mapaNodos).forEach(id => {
        const nodeInfo = mapaNodos[id];
        const isCollapsed = !!linuxCollapsedNodes[nodeInfo.codigo];
        if (!isCollapsed) {
          expandidos.push({
            id: parseInt(id),
            nombre: nodeInfo.nombre,
            tipo: nodeInfo.tipo
          });
        }
      });
    } else {
      let expandidosIds = [];
      try {
        expandidosIds = JSON.parse(localStorage.getItem('pref_arbol_expandidos') || '[]');
      } catch(e) {}

      if (expandidosIds.length === 0) {
        const recorrerGrafico = (node) => {
          if (node._collapsed === false) {
            const id = node.attributes?.id;
            if (id) expandidosIds.push(id);
          }
          if (node.children) {
            node.children.forEach(recorrerGrafico);
          }
        };
        recorrerGrafico(treeData);
      }

      expandidosIds.forEach(id => {
        const numId = parseInt(id);
        if (mapaNodos[numId]) {
          expandidos.push({
            id: numId,
            nombre: mapaNodos[numId].nombre,
            tipo: mapaNodos[numId].tipo
          });
        }
      });
    }

    localStorage.setItem('pref_arbol_expandidos_guardados', JSON.stringify(expandidos));
    
    const ids = expandidos.map(x => x.id);
    localStorage.setItem('pref_arbol_expandidos', JSON.stringify(ids));

    triggerNotification("Vista Guardada", `Se guardó tu configuración con ${expandidos.length} ramas desplegadas.`);
  };

  // --- MÓDULO DE COPIAS DE SEGURIDAD (BACKUPS) ---
  const fetchBackups = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/sistema/backups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      }
    } catch (err) {
      console.error("Error al cargar copias de seguridad:", err);
    }
  };

  const handleCrearBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const res = await fetch(`${API_BASE_URL}/sistema/backup/crear?tipo=${backupTipo}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        triggerNotification("Copia Creada", `Se generó el archivo ${data.filename} con éxito.`);
        fetchBackups();
      } else {
        const errData = await res.json();
        triggerNotification("Error de Backup", errData.detail || "No se pudo crear el backup.");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Error de Conexión", "No se pudo conectar con el servidor.");
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleEliminarBackup = async (nombre) => {
    try {
      const res = await fetch(`${API_BASE_URL}/sistema/backup/eliminar/${nombre}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        triggerNotification("Copia Eliminada", "El archivo de respaldo fue eliminado del servidor.");
        fetchBackups();
      } else {
        const errData = await res.json();
        triggerNotification("Error al Eliminar", errData.detail || "No se pudo borrar el backup.");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Error de Conexión", "No se pudo conectar con el servidor.");
    }
  };

  // Cargar Configuración de Codificación Inteligente
  const fetchConfigCodificacion = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/configuracion-codificacion/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConfigCodificacion(data);
      }
    } catch (err) {
      console.error("Error al cargar la configuración de codificación:", err);
    }
  };

  // Cargar Estados de Workflow
  const fetchEstados = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/estados/`);
      if (res.ok) {
        const data = await res.json();
        setEstados(data);
      }
    } catch (err) {
      console.error("Error al cargar estados de workflow:", err);
    }
  };

  // Cargar Transiciones de Workflow
  const fetchTransiciones = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/estados/transiciones`);
      if (res.ok) {
        const data = await res.json();
        setTransiciones(data);
      }
    } catch (err) {
      console.error("Error al cargar transiciones:", err);
    }
  };

  // Cargar Alertas de Retención y Transferencia
  const fetchAlertasRetencion = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/retencion/alertas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleSessionExpired();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setAlertasRetencion(data);
      }
    } catch (err) {
      console.error("Error al cargar alertas de retención:", err);
    }
  };

  const handleTransferirDocumentoFisico = async (docId) => {
    if (userRol !== 'admin') return;
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/retencion/transferir/${docId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleSessionExpired();
        return;
      }
      if (res.ok) {
        triggerNotification("Transferencia Completada", "El documento ha sido transferido físicamente a la ubicación de destino.");
        await fetchAlertasRetencion();
        await fetchTreeData();
        setTreeKey(prev => prev + 1);
        if (selectedNode && selectedNode.attributes?.id) {
          await fetchDocuments(selectedNode.attributes.id);
        }
      } else {
        const errData = await res.json();
        triggerNotification("Error de Transferencia", errData.detail || 'Operación fallida', "error");
      }
    } catch (err) {
      console.error("Error de red al transferir documento:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar Usuarios (Solo Admin)
  const fetchUsuarios = async () => {
    if (userRol !== 'admin') return;
    try {
      const res = await fetch(`${API_BASE_URL}/usuarios/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleSessionExpired();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data);
      }
    } catch (err) {
      console.error("Error al cargar lista de usuarios:", err);
    }
  };

  // Cargar estadísticas
  const fetchEstadisticas = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/nodos/estadisticas/globales`);
      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
      }
    } catch (err) {
      console.error("Error al cargar estadísticas globales:", err);
    }
  };

  // Cargar logs
  const fetchLogs = async () => {
    if (userRol !== 'admin') return;
    try {
      const res = await fetch(`${API_BASE_URL}/logs/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleSessionExpired();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error("Error al cargar logs de auditoría:", err);
    }
  };

  // Cargar Directorio de Personas
  const fetchPersonas = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/personas/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPersonas(data);
      }
    } catch (err) {
      console.error("Error al cargar Directorio de Personas:", err);
    }
  };

  // Cargar Roles Organizacionales Dinámicos
  const fetchRolesOrganizacion = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/roles-organizacion/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRolesOrganizacion(data);
        if (data.length > 0 && !newPersonaRolId) {
          setNewPersonaRolId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Error al cargar Roles de Organización:", err);
    }
  };

  const handleCreateRolOrganizacion = async (e) => {
    e.preventDefault();
    if (!newRolNombre.trim() || !newRolCodigo.trim()) return;
    
    const bodyData = {
      nombre: newRolNombre.trim(),
      codigo: newRolCodigo.trim().toUpperCase(),
      color: newRolColor
    };
    
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/roles-organizacion/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });
      
      if (res.ok) {
        await fetchRolesOrganizacion();
        setNewRolNombre('');
        setNewRolCodigo('');
        setNewRolColor('#3b82f6');
        triggerNotification("Rol Corporativo Creado", "Se guardó el nuevo rol en el sistema.");
      } else {
        const errData = await res.json();
        triggerNotification("Error al crear Rol", errData.detail || 'No se pudo crear el rol', "error");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRolOrganizacion = (rolId) => {
    setConfirmModal({
      show: true,
      title: 'Eliminar Rol de Organización',
      message: '¿Está seguro de eliminar este rol? Se desvinculará de todas las personas asociadas.',
      requireTextConfirm: false,
      inputValue: '',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        try {
          setIsLoading(true);
          const res = await fetch(`${API_BASE_URL}/roles-organizacion/${rolId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            await fetchRolesOrganizacion();
            await fetchPersonas();
            triggerNotification("Rol Eliminado", "El rol fue removido de la base de datos.");
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // Registrar persona en el catálogo central
  const handleCreatePersona = async (e) => {
    e.preventDefault();
    if (!newPersonaIdentificacion.trim() || !newPersonaNombre.trim() || !newPersonaRolId) return;
    
    const bodyData = {
      identificacion: newPersonaIdentificacion.trim(),
      nombre_completo: newPersonaNombre.trim(),
      rol_actual_id: parseInt(newPersonaRolId),
      carrera_departamento: newPersonaCarrera.trim() || null,
      crear_usuario: newPersonaCrearUsuario,
      username: newPersonaCrearUsuario ? newPersonaUsername.trim() : null
    };
    
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/personas/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });
      
      if (res.ok) {
        await fetchPersonas();
        try {
          const uRes = await fetch(`${API_BASE_URL}/usuarios/`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (uRes.ok) setUsuarios(await uRes.json());
        } catch(errUsr) {}

        setNewPersonaIdentificacion('');
        setNewPersonaNombre('');
        if (rolesOrganizacion.length > 0) {
          setNewPersonaRolId(rolesOrganizacion[0].id);
        }
        setNewPersonaCarrera('');
        setNewPersonaCrearUsuario(false);
        setNewPersonaUsername('');
        setNewPersonaPassword('');
        setShowCreatePersonaModal(false);
        triggerNotification("Persona Registrada", "Se guardó al miembro en el Directorio Central.");
      } else {
        const errData = await res.json();
        triggerNotification("Error al registrar", errData.detail || 'No se pudo registrar la persona', "error");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener permisos de acceso de la categoría
  const fetchPermisosNodo = async (nodoId) => {
    if (!nodoId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/nodos/${nodoId}/permisos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPermisosNodo(await res.json());
      }
    } catch (err) {
      console.error("Error al obtener permisos de categoría:", err);
    }
  };

  // Crear un nuevo permiso de acceso en la categoría
  const handleCreatePermisoNodo = async (e) => {
    e.preventDefault();
    if (!selectedNode?.attributes?.id) return;
    if (selectedPermisoDestinatarioType === 'usuario' && !selectedPermisoUsuarioId) return;
    if (selectedPermisoDestinatarioType === 'rol' && !selectedPermisoRolId) return;

    const payloadBody = {
      tipo_permiso: selectedPermisoTipo
    };

    if (selectedPermisoDestinatarioType === 'usuario') {
      payloadBody.usuario_id = parseInt(selectedPermisoUsuarioId);
    } else {
      payloadBody.rol_organizacion_id = parseInt(selectedPermisoRolId);
    }

    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/nodos/${selectedNode.attributes.id}/permisos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payloadBody)
      });

      if (res.ok) {
        await fetchPermisosNodo(selectedNode.attributes.id);
        setSelectedPermisoUsuarioId('');
        setSelectedPermisoRolId('');
        triggerNotification("Permiso Otorgado", "El acceso se concedió con éxito.");
      } else {
        const errData = await res.json();
        triggerNotification("Error de Permiso", errData.detail || 'No se pudo otorgar el permiso', "error");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar un permiso de acceso de la categoría
  const handleDeletePermisoNodo = async (permisoId) => {
    if (!permisoId || !selectedNode?.attributes?.id) return;
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/nodos/permisos/${permisoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchPermisosNodo(selectedNode.attributes.id);
        triggerNotification("Acceso Revocado", "Se removió el permiso del usuario.");
      } else {
        const errData = await res.json();
        triggerNotification("Error al revocar", errData.detail || 'No se pudo revocar el acceso', "error");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener vistas guardadas del usuario
  const fetchVistasGuardadas = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/vistas/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setVistasGuardadas(await res.json());
      }
    } catch (err) {
      console.error("Error al obtener vistas guardadas:", err);
    }
  };

  // Helper para obtener la lista de IDs de nodos expandidos actuales según la vista activa
  const obtenerNodosExpandidosActuales = () => {
    const expandidos = [];
    if (!treeData) return expandidos;

    const mapaNodos = {};
    const recorrerNodos = (node) => {
      const id = node.attributes?.id;
      if (id) {
        mapaNodos[id] = {
          nombre: node.name,
          tipo: node.attributes?.es_ubicacion_fisica ? 'Física' : 'Lógica',
          codigo: node.attributes?.codigo
        };
      }
      if (node.children) {
        node.children.forEach(recorrerNodos);
      }
    };
    recorrerNodos(treeData);

    // Si la vista activa es Consola Linux (activeMenu === 'consola_tree')
    if (activeMenu === 'consola_tree') {
      Object.keys(mapaNodos).forEach(id => {
        const nodeInfo = mapaNodos[id];
        const isCollapsed = !!linuxCollapsedNodes[nodeInfo.codigo];
        if (!isCollapsed) {
          expandidos.push(parseInt(id));
        }
      });
    } else {
      // Árbol Gráfico (D3)
      let expandidosIds = [];
      try {
        expandidosIds = JSON.parse(localStorage.getItem(`pref_arbol_expandidos_${tipoJerarquia}`) || '[]');
      } catch(e) {}

      if (expandidosIds.length === 0) {
        const recorrerGrafico = (node) => {
          if (node._collapsed === false) {
            const id = node.attributes?.id;
            if (id) expandidosIds.push(id);
          }
          if (node.children) {
            node.children.forEach(recorrerGrafico);
          }
        };
        recorrerGrafico(treeData);
      }
      expandidosIds.forEach(id => {
        const numId = parseInt(id);
        if (mapaNodos[numId]) {
          expandidos.push(numId);
        }
      });
    }
    return expandidos;
  };

  // Crear o actualizar una vista guardada por nombre
  const handleSaveVista = async (e) => {
    e.preventDefault();
    if (!newVistaName.trim()) return;

    const expandidos = obtenerNodosExpandidosActuales();

    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/vistas/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: newVistaName.trim(),
          tipo_arbol: tipoJerarquia,
          nodos_expandidos: expandidos
        })
      });

      if (res.ok) {
        const nuevaVista = await res.json();
        triggerNotification("Vista Guardada", `La vista "${newVistaName}" fue registrada con éxito.`);
        setNewVistaName('');
        setShowSaveVistaModal(false);
        await fetchVistasGuardadas();
        setSelectedVistaId(nuevaVista.id.toString());
      } else {
        const errData = await res.json();
        triggerNotification("Error al guardar", errData.detail || 'No se pudo guardar la vista', "error");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar una vista guardada
  const handleDeleteVista = (vistaId) => {
    if (!vistaId) return;
    setConfirmModal({
      show: true,
      title: 'Eliminar Configuración de Vista',
      message: '¿Está seguro de eliminar esta configuración de vista? Esta acción no se puede deshacer.',
      requireTextConfirm: false,
      inputValue: '',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        try {
          setIsLoading(true);
          const res = await fetch(`${API_BASE_URL}/vistas/${vistaId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            triggerNotification("Vista Eliminada", "La configuración de vista fue removida.");
            setSelectedVistaId('');
            await fetchVistasGuardadas();
          } else {
            const errData = await res.json();
            triggerNotification("Error al eliminar", errData.detail || 'No se pudo eliminar la vista', "error");
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // Cargar/Aplicar una vista guardada en el árbol
  const handleApplyVista = (vistaId) => {
    const vista = vistasGuardadas.find(v => v.id === parseInt(vistaId));
    if (!vista) return;

    // Guardar los IDs en el localStorage para que D3 y la consola los lean
    const idsString = vista.nodos_expandidos.map(String);
    localStorage.setItem(`pref_arbol_expandidos_guardados_${vista.tipo_arbol}`, JSON.stringify(idsString));
    localStorage.setItem(`pref_arbol_expandidos_${vista.tipo_arbol}`, JSON.stringify(idsString));

    // Refrescar el árbol actual
    fetchTreeData(tipoJerarquia);
    triggerNotification("Vista Aplicada", `Se cargó la vista "${vista.nombre}" con éxito.`);
  };

  // Abrir expediente consolidado
  const fetchExpediente = async (personaId) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/personas/${personaId}/expediente`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedPersonaExpediente(data);
        setShowExpedienteModal(true);
      } else {
        triggerNotification("Error de Expediente", "No se pudo obtener el expediente.", "error");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Vincular persona a activo (nodo o documento)
  const handleLinkPersonaSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLinkPersona) return;
    
    const bodyData = {
      persona_id: selectedLinkPersona.id,
      nodo_id: linkTargetType === 'nodo' ? linkTargetId : null,
      documento_id: linkTargetType === 'documento' ? linkTargetId : null,
      rol_momento_id: linkPersonaRolMomentoId ? parseInt(linkPersonaRolMomentoId) : null,
      tipo_relacion: linkPersonaTipoRelacion.trim(),
      peso: parseInt(linkPersonaPeso)
    };
    
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/vinculos/persona`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });
      
      if (res.ok) {
        triggerNotification("Miembro Vinculado", "Se creó la relación con éxito.");
        setShowLinkPersonaModal(false);
        setSelectedLinkPersona(null);
        setLinkPersonaSearchQuery('');
        setLinkPersonaTipoRelacion('Propietario');
        setLinkPersonaPeso(5);
        
        await fetchTreeData();
        setTreeKey(prev => prev + 1);
        if (selectedNode) {
          if (linkTargetType === 'nodo' && selectedNode.attributes?.id === linkTargetId) {
            const resNode = await fetch(`${API_BASE_URL}/nodos/arbol?tipo=${tipoJerarquia}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resNode.ok) {
              const dataTree = await resNode.json();
              const findNode = (r, id) => {
                if (r.attributes?.id === id) return r;
                if (r.children) {
                  for (let c of r.children) {
                    const found = findNode(c, id);
                    if (found) return found;
                  }
                }
                return null;
              };
              const updatedN = findNode(dataTree, linkTargetId);
              if (updatedN) setSelectedNode(updatedN);
            }
          } else {
            await fetchDocuments(selectedNode.attributes.id);
          }
        }
      } else {
        const errData = await res.json();
        triggerNotification("Error al Vincular", errData.detail || 'No se pudo crear la relación', "error");
      }
    } catch (err) {
      triggerNotification("Error de Conexión", "Error al conectar con el servidor.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar vínculo de persona
  const handleDeleteVinculoPersona = (vinculoId, targetType, targetId) => {
    setConfirmModal({
      show: true,
      title: 'Eliminar Vinculación de Persona',
      message: '¿Está seguro de eliminar esta vinculación de persona? Esta acción es irreversible.',
      requireTextConfirm: false,
      inputValue: '',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        try {
          setIsLoading(true);
          const res = await fetch(`${API_BASE_URL}/vinculos/persona/${vinculoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (res.ok) {
            triggerNotification("Vínculo Eliminado", "La relación se removió correctamente.");
            await fetchTreeData();
            setTreeKey(prev => prev + 1);
            if (selectedNode) {
              if (targetType === 'nodo' && selectedNode.attributes?.id === targetId) {
                const resNode = await fetch(`${API_BASE_URL}/nodos/arbol?tipo=${tipoJerarquia}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resNode.ok) {
                  const dataTree = await resNode.json();
                  const findNode = (r, id) => {
                    if (r.attributes?.id === id) return r;
                    if (r.children) {
                      for (let c of r.children) {
                        const found = findNode(c, id);
                        if (found) return found;
                      }
                    }
                    return null;
                  };
                  const updatedN = findNode(dataTree, targetId);
                  if (updatedN) setSelectedNode(updatedN);
                }
              } else {
                await fetchDocuments(selectedNode.attributes.id);
              }
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // Crear enlace cruzado (Shortcut)
  const handleCreateEnlaceCruzado = async (e) => {
    e.preventDefault();
    if (!selectedLinkCruzadoNode) return;
    
    const bodyData = {
      nodo_origen_id: linkTargetType === 'nodo' ? linkTargetId : null,
      documento_origen_id: linkTargetType === 'documento' ? linkTargetId : null,
      nodo_destino_id: selectedLinkCruzadoNode.id
    };
    
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/vinculos/cruzado`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });
      
      if (res.ok) {
        triggerNotification("Acceso Directo Creado", "La referencia cruzada se registró con éxito.");
        setShowLinkCruzadoModal(false);
        setSelectedLinkCruzadoNode(null);
        setLinkCruzadoSearchQuery('');
        
        await fetchTreeData();
        setTreeKey(prev => prev + 1);
        if (selectedNode) {
          await fetchDocuments(selectedNode.attributes.id);
        }
      } else {
        const errData = await res.json();
        triggerNotification("Error de Enlace", errData.detail || 'No se pudo crear el acceso directo', "error");
      }
    } catch (err) {
      triggerNotification("Error de Red", "Error de red al conectar con el servidor.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar enlace cruzado
  const handleDeleteEnlaceCruzado = (enlaceId) => {
    setConfirmModal({
      show: true,
      title: 'Eliminar Acceso Directo Virtual',
      message: '¿Está seguro de eliminar este acceso directo virtual?',
      requireTextConfirm: false,
      inputValue: '',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        try {
          setIsLoading(true);
          const res = await fetch(`${API_BASE_URL}/vinculos/cruzado/${enlaceId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (res.ok) {
            triggerNotification("Acceso Directo Eliminado", "La referencia se removió de esta carpeta.");
            await fetchTreeData();
            setTreeKey(prev => prev + 1);
            if (selectedNode) {
              await fetchDocuments(selectedNode.attributes.id);
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // --------------------------------------------------------------------------
  // Funciones del Módulo de Registro desde Escáner (Cámara + TWAIN)
  // --------------------------------------------------------------------------
  
  const startCameraScan = async () => {
    setScannedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setScannerCameraStream(stream);
      setTimeout(() => {
        const video = document.getElementById('scanner-video');
        if (video) video.srcObject = stream;
      }, 300);
    } catch (err) {
      triggerNotification("Error de Cámara", "No se pudo iniciar la cámara web o no se tienen permisos.", "error");
    }
  };

  const stopCameraScan = () => {
    if (scannerCameraStream) {
      scannerCameraStream.getTracks().forEach(track => track.stop());
      setScannerCameraStream(null);
    }
  };

  const captureCameraFrame = () => {
    const video = document.getElementById('scanner-video');
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Filtro de Contraste B&W Digitalizado (Umbralización)
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];
      const v = (0.2126*r + 0.7152*g + 0.0722*b >= 120) ? 255 : 0;
      data[i] = v;
      data[i+1] = v;
      data[i+2] = v;
    }
    ctx.putImageData(imgData, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setScannedImage(dataUrl);
    stopCameraScan();
  };

  const startTwainScan = () => {
    setIsScanningAnim(true);
    setScanProgress(0);
    setScannedImage(null);
    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      setScanProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        
        // Canvas simulando digitalización real Fujitsu ScanSnap
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 600, 800);
        
        // Bordes y cuadrícula neón de Archi-vite
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.15)';
        ctx.lineWidth = 1;
        for (let x = 30; x < 600; x += 50) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 800);
          ctx.stroke();
        }
        for (let y = 30; y < 800; y += 50) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(600, y);
          ctx.stroke();
        }
        
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 22px Outfit, sans-serif';
        ctx.fillText('ARCHI-VITE GLOBAL DMS ECOSISTEMA', 50, 80);
        
        ctx.fillStyle = '#6366f1';
        ctx.font = 'bold 13px monospace';
        ctx.fillText('DIGITALIZADO POR EMULADOR TWAIN (Fujitsu ScanSnap)', 50, 115);
        
        ctx.font = '12px Outfit, sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText(`Código DMS ID: AV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 50, 170);
        ctx.fillText(`Fecha Digitalizado: ${new Date().toLocaleString()}`, 50, 195);
        ctx.fillText(`Operador Autenticado: ${username}`, 50, 220);
        
        ctx.font = 'bold 14px Outfit, sans-serif';
        ctx.fillStyle = '#1e1b4b';
        ctx.fillText('INTEGRIDAD DE ARCHIVOS Y EXPEDIENTES ACADÉMICOS', 50, 280);
        
        ctx.font = 'italic 11px Outfit, sans-serif';
        ctx.fillText('Este documento digitalizado posee OCR habilitado y vinculación cruzada', 50, 310);
        ctx.fillText('dinámica de personas por relevancia (pesos del 1 al 10) en Archi-vite.', 50, 330);
        
        // Firma
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(400, 680);
        ctx.bezierCurveTo(420, 650, 480, 650, 500, 680);
        ctx.stroke();
        ctx.font = '10px monospace';
        ctx.fillStyle = '#a855f7';
        ctx.fillText('FIRMA AUTÓGRAFA DIGITAL', 400, 710);

        setScannedImage(canvas.toDataURL('image/jpeg'));
        setIsScanningAnim(false);
        triggerNotification("Escaneo Completo", "TWAIN Fujitsu finalizó la digitalización.");
      }
    }, 200);
  };

  const handleScanUpload = async (e) => {
    e.preventDefault();
    if (!scannedImage) return;
    
    try {
      setIsLoading(true);
      const responseB = await fetch(scannedImage);
      const blob = await responseB.blob();
      const file = new File([blob], scannedFileName, { type: 'image/jpeg' });
      
      const formData = new FormData();
      formData.append('file', file);
      if (scannedLogicalNodeId) {
        formData.append('nodo_id', scannedLogicalNodeId);
      }
      if (scannedPhysicalNodeId) {
        formData.append('ubicacion_fisica_id', scannedPhysicalNodeId);
      }
      
      const res = await fetch(`${API_BASE_URL}/documentos/subir`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (res.ok) {
        const docResult = await res.json();
        
        // Vincular persona en caliente si se seleccionó
        if (scannedLinkPersona) {
          const relationData = {
            persona_id: scannedLinkPersona.id,
            documento_id: docResult.id,
            rol_momento_id: scannedLinkPersonaRolMomentoId ? parseInt(scannedLinkPersonaRolMomentoId) : null,
            tipo_relacion: scannedLinkPersonaRelacion.trim(),
            peso: parseInt(scannedLinkPersonaPeso)
          };
          await fetch(`${API_BASE_URL}/vinculos/persona`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(relationData)
          });
        }
        
        triggerNotification("Archivo Escaneado Subido", "Se guardó y catalogó el documento digitalizado.");
        setShowScannerModal(false);
        setScannedImage(null);
        setScannedLinkPersona(null);
        setScannedLinkPersonaQuery('');
        
        await fetchTreeData();
        setTreeKey(prev => prev + 1);
        if (selectedNode) {
          await fetchDocuments(selectedNode.attributes.id);
        }
      } else {
        triggerNotification("Error de Subida", "No se pudo subir el archivo escaneado.", "error");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Error de Conexión", "Error al conectar con el servidor.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Hook para buscar personas del catálogo central para vincular
  useEffect(() => {
    if (linkPersonaSearchQuery.trim().length > 0) {
      const q = linkPersonaSearchQuery.toLowerCase();
      const match = personas.filter(p => 
        p.nombre_completo.toLowerCase().includes(q) || 
        p.identificacion.toLowerCase().includes(q)
      );
      setLinkPersonaSearchResults(match.slice(0, 8));
    } else {
      setLinkPersonaSearchResults([]);
    }
  }, [linkPersonaSearchQuery, personas]);

  // Hook para buscar personas en el modal de escaneado
  useEffect(() => {
    if (scannedLinkPersonaQuery.trim().length > 0) {
      const q = scannedLinkPersonaQuery.toLowerCase();
      const match = personas.filter(p => 
        p.nombre_completo.toLowerCase().includes(q) || 
        p.identificacion.toLowerCase().includes(q)
      );
      setScannedLinkPersonaSearchResults(match.slice(0, 8));
    } else {
      setScannedLinkPersonaSearchResults([]);
    }
  }, [scannedLinkPersonaQuery, personas]);

  // Hook para buscar categorías de destino para accesos directos
  useEffect(() => {
    if (linkCruzadoSearchQuery.trim().length > 0 && treeData) {
      const resultados = [];
      const buscarRecursivo = (node) => {
        const nombreCoincide = node.name.toLowerCase().includes(linkCruzadoSearchQuery.toLowerCase());
        const codigoCoincide = node.attributes?.codigo?.toLowerCase().includes(linkCruzadoSearchQuery.toLowerCase());
        const esArchivo = node.attributes?.es_archivo === true;
        
        if ((nombreCoincide || codigoCoincide) && !esArchivo) {
          if (node.attributes?.codigo !== 'SYS') {
            resultados.push({
              id: node.attributes?.id,
              nombre: node.name,
              codigo: node.attributes?.codigo,
              es_ubicacion_fisica: node.attributes?.es_ubicacion_fisica
            });
          }
        }
        if (node.children) {
          node.children.forEach(buscarRecursivo);
        }
      };
      buscarRecursivo(treeData);
      setLinkCruzadoSearchResults(resultados.slice(0, 8));
    } else {
      setLinkCruzadoSearchResults([]);
    }
  }, [linkCruzadoSearchQuery, treeData]);

  useEffect(() => {
    if (token) {
      fetchTreeData();
      fetchEstados();
      fetchTransiciones();
      fetchEstadisticas();
      fetchUsuarios();
      fetchLogs();
      fetchPersonas();
      fetchRolesOrganizacion();
      fetchConfigCodificacion();
      fetchAlertasRetencion();
      fetchVistasGuardadas();
    }
  }, [token]);

  // Aplicar preferencias visuales en tiempo real y persistirlas
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light-mode');
    localStorage.removeItem('pref_modo_luz');
    
    // Paletas de Colores
    let primary = '#a855f7';
    let secondary = '#6366f1';
    let primaryGlow = 'rgba(168, 85, 247, 0.35)';
    let primaryGlowBg = 'rgba(168, 85, 247, 0.15)';
    
    if (prefTemaColor === 'ocean') {
      primary = '#06b6d4';
      secondary = '#3b82f6';
      primaryGlow = 'rgba(6, 182, 212, 0.35)';
      primaryGlowBg = 'rgba(6, 182, 212, 0.15)';
    } else if (prefTemaColor === 'emerald') {
      primary = '#10b981';
      secondary = '#14b8a6';
      primaryGlow = 'rgba(16, 185, 129, 0.35)';
      primaryGlowBg = 'rgba(16, 185, 129, 0.15)';
    } else if (prefTemaColor === 'amber') {
      primary = '#f59e0b';
      secondary = '#ef4444';
      primaryGlow = 'rgba(245, 158, 11, 0.35)';
      primaryGlowBg = 'rgba(245, 158, 11, 0.15)';
    }
    
    root.style.setProperty('--primary-glow', primary);
    root.style.setProperty('--secondary-glow', secondary);
    root.style.setProperty('--primary-glow-bg', primaryGlowBg);
    root.style.setProperty('--primary-glow-border', primaryGlow);
    root.style.setProperty('--glow-shadow-intensity', prefEfectosGlow ? primaryGlow : 'transparent');
    
    // Tipografías
    let font = 'Outfit, sans-serif';
    if (prefTipoFuente === 'Inter') {
      font = 'Inter, sans-serif';
    } else if (prefTipoFuente === 'Fira Code') {
      font = 'Fira Code, monospace';
    }
    root.style.setProperty('--font-family-system', font);
    
    // Persistencia
    localStorage.setItem('pref_tema_color', prefTemaColor);
    localStorage.setItem('pref_tipo_fuente', prefTipoFuente);
    localStorage.setItem('pref_efectos_glow', prefEfectosGlow);
    localStorage.setItem('pref_sonido_qr', prefSonidoQR);
  }, [prefTemaColor, prefTipoFuente, prefEfectosGlow, prefSonidoQR]);

  // Ejecutar recargas automáticas cuando cambia el menú
  useEffect(() => {
    if (token) {
      // Siempre refrescar alertas en segundo plano al cambiar de vista para mantener el contador exacto
      fetchAlertasRetencion();

      if (activeMenu === 'dashboard') {
        fetchEstadisticas();
        fetchLogs();
      } else if (activeMenu === 'workflow') {
        fetchEstados();
        fetchTransiciones();
      } else if (activeMenu === 'usuarios') {
        fetchUsuarios();
        fetchPersonas();
        fetchRolesOrganizacion();
      } else if (activeMenu === 'auditoria') {
        fetchLogs();
      } else if (activeMenu === 'codificacion') {
        fetchConfigCodificacion();
      } else if (activeMenu === 'configuracion') {
        fetchBackups();
      } else if (activeMenu === 'alertas') {
        fetchAlertasRetencion();
      } else if (activeMenu === 'reportes') {
        fetchReportesEstadisticas();
      }
    }
  }, [activeMenu]);

  // 2. Cargar documentos del nodo seleccionado
  const fetchDocuments = async (nodeId) => {
    if (!nodeId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/nodos/${nodeId}/documentos`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error("Error al traer documentos del nodo:", err);
    }
  };

  useEffect(() => {
    if (selectedNode && selectedNode.attributes?.id) {
      fetchDocuments(selectedNode.attributes.id);
      fetchPermisosNodo(selectedNode.attributes.id);
    } else {
      setDocuments([]);
      setPermisosNodo([]);
    }
  }, [selectedNode]);

  // 3. Buscador en caliente
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setIsSearching(true);
        try {
          const res = await fetch(`${API_BASE_URL}/nodos/buscar?q=${searchQuery}`);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data);
          }
        } catch (err) {
          console.error("Error al buscar:", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectSearchResult = (result) => {
    setActiveMenu('jerarquias');
    if (result.es_archivo) {
      setPreviewFileName(result.nombre);
      setPreviewFileUrl(`${API_BASE_URL}${result.ruta}`);
      
      const ext = result.nombre.split('.').pop().toLowerCase();
      if (ext === 'pdf') setPreviewFileType('pdf');
      else if (['doc','docx','xls','xlsx'].includes(ext)) setPreviewFileType('office');
      else if (['png','jpg','jpeg','gif'].includes(ext)) setPreviewFileType('image');
      else setPreviewFileType('generic');
      
      setShowPreviewModal(true);
    } 
    else {
      const findNodeByCode = (root, code) => {
        if (root.attributes?.codigo === code) return root;
        if (root.children) {
          for (let child of root.children) {
            const found = findNodeByCode(child, code);
            if (found) return found;
          }
        }
        return null;
      };

      if (treeData) {
        const node = findNodeByCode(treeData, result.codigo);
        if (node) {
          setSelectedNode(node);
          setIsRightCollapsed(false);
        }
      }
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  // Hook para buscar nodos padre localmente (excluye archivos)
  useEffect(() => {
    if (addParentSearchQuery.trim().length > 0 && treeData) {
      const resultados = [];
      const buscarRecursivo = (node) => {
        const nombreCoincide = node.name.toLowerCase().includes(addParentSearchQuery.toLowerCase());
        const codigoCoincide = node.attributes?.codigo?.toLowerCase().includes(addParentSearchQuery.toLowerCase());
        const esArchivo = node.attributes?.es_archivo === true;
        
        if ((nombreCoincide || codigoCoincide) && !esArchivo) {
          if (node.attributes?.codigo !== 'SYS') {
            resultados.push({
              id: node.attributes?.id,
              nombre: node.name,
              codigo: node.attributes?.codigo,
              es_ubicacion_fisica: node.attributes?.es_ubicacion_fisica
            });
          }
        }
        if (node.children) {
          node.children.forEach(buscarRecursivo);
        }
      };
      buscarRecursivo(treeData);
      setAddParentSearchResults(resultados.slice(0, 10));
    } else {
      setAddParentSearchResults([]);
    }
  }, [addParentSearchQuery, treeData]);

  // 4. Agregar una subcategoría con Padre Flexible y Foto Opcional (Solo Admin)
  const handleAddChildNode = async (e) => {
    e.preventDefault();
    if (!newNodeName.trim() || !newNodeAbbreviation.trim()) return;

    // Si el buscador está vacío y no hay preselección, se hereda del selectedNode, o null si no hay nada
    const parentId = addParentNode ? addParentNode.id : (selectedNode ? selectedNode.attributes?.id : null);

    const bodyData = {
      nombre: newNodeName.trim(),
      abreviacion: newNodeAbbreviation.trim().toUpperCase(),
      parent_id: parentId,
      es_ubicacion_fisica: isPhysicalLocation,
      detalles_ubicacion: isPhysicalLocation ? { creado_via: "web_ui" } : null,
      codigo_inteligente: isManualCodigoActive && manualCodigoInput.trim() ? manualCodigoInput.trim().toUpperCase() : null,
      meses_retencion_limite: isPhysicalLocation && newNodeRetentionMonths ? parseInt(newNodeRetentionMonths) : null,
      nodo_destino_transferencia_id: isPhysicalLocation && newNodeTransferDestinationId ? parseInt(newNodeTransferDestinationId) : null
    };

    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/nodos/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        const nuevoNodo = await res.json();
        
        // Si es físico y seleccionó imagen, subirla inmediatamente
        if (isPhysicalLocation && nodeImageFile) {
          const formData = new FormData();
          formData.append('file', nodeImageFile);
          
          const imgRes = await fetch(`${API_BASE_URL}/nodos/${nuevoNodo.id}/imagen`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
          
          if (!imgRes.ok) {
            console.error("Error al subir la imagen.");
            triggerNotification("Nodo creado sin foto", "La categoría física se registró pero falló la carga de la imagen.");
          }
        }
        
        await fetchTreeData();
        setTreeKey(prev => prev + 1);
        
        // Limpiar
        setNewNodeName('');
        setNewNodeAbbreviation('');
        setIsPhysicalLocation(false);
        setAddParentNode(null);
        setAddParentSearchQuery('');
        setNodeImageFile(null);
        setManualCodigoInput('');
        setIsManualCodigoActive(false);
        setNewNodeRetentionMonths('');
        setNewNodeTransferDestinationId('');
        setShowAddModal(false);
        triggerNotification("Categoría Creada", `Se registró '${nuevoNodo.nombre}' con éxito.`);
      } else {
        const errData = await res.json();
        triggerNotification("Error al crear", errData.detail || 'No se pudo crear la categoría.', "error");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Error de Red", "Error de red al conectar con el servidor.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Subir MÚLTIPLES archivos físicos al DMS secuencialmente
  const uploadMultipleFilesToNode = async (files, nodeId) => {
    if (userRol !== 'admin') {
      triggerNotification("Operación denegada", "Solo el Administrador de Infraestructura tiene permisos para registrar documentos.");
      return;
    }
    
    setIsLoading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch(`${API_BASE_URL}/nodos/${nodeId}/documentos/subir`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        
        if (res.status === 401) {
          handleSessionExpired();
          setIsLoading(false);
          return;
        }
        
        if (!res.ok) {
          const errData = await res.json();
          console.error(`Error al registrar ${file.name}:`, errData.detail);
        }
      }
      
      await fetchTreeData();
      setTreeKey(prev => prev + 1);
      if (selectedNode && selectedNode.attributes?.id === nodeId) {
        await fetchDocuments(nodeId);
      }
      fetchEstadisticas();
    } catch (err) {
      console.error(err);
      triggerNotification("Error de Subida", "Error al procesar la subida masiva de archivos.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUploadClick = () => {
    if (userRol !== 'admin') {
      triggerNotification("Permiso denegado", "Se requieren credenciales de Administrador de Infraestructura.");
      return;
    }
    fileInputRef.current.click();
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0 || !selectedNode || !selectedNode.attributes?.id) return;
    await uploadMultipleFilesToNode(files, selectedNode.attributes.id);
    e.target.value = null; // Reset input
  };

  const handleNodeCardUploadClick = (e, nodeId) => {
    e.stopPropagation();
    if (userRol !== 'admin') {
      triggerNotification("Permiso denegado", "Se requieren credenciales de Administrador.");
      return;
    }
    setUploadTargetNodeId(nodeId);
    nodeSpecificUploadRef.current.click();
  };

  const handleNodeSpecificUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0 && uploadTargetNodeId) {
      await uploadMultipleFilesToNode(files, uploadTargetNodeId);
    }
    e.target.value = null;
    setUploadTargetNodeId(null);
  };

  const nodeImageUploadRef = useRef(null);

  const handleNodeImageUpload = async (e) => {
    if (!e.target.files || !e.target.files[0] || !selectedNode) return;
    const file = e.target.files[0];
    const nodeId = selectedNode.attributes.id;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/nodos/${nodeId}/imagen`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (res.ok) {
        const updatedNode = await res.json();
        triggerNotification("Foto Actualizada", "Se ha cargado la imagen de la ubicación física con éxito.");
        await fetchTreeData();
        setTreeKey(prev => prev + 1);
        
        setSelectedNode(prev => ({
          ...prev,
          attributes: {
            ...prev.attributes,
            detalles_ubicacion: updatedNode.detalles_ubicacion
          }
        }));
      } else {
        alert("No se pudo cargar la imagen.");
      }
    } catch (err) {
      console.error(err);
      alert("Error al subir la imagen.");
    } finally {
      setIsLoading(false);
    }
  };

  // Drag over y Drop sobre el árbol
  const handleDropFileOnNode = async (e, nodeDatum) => {
    e.preventDefault();
    setDragOverNodeCode(null);
    const nodeId = nodeDatum.attributes?.id;
    if (!nodeId) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      await uploadMultipleFilesToNode(files, nodeId);
    }
  };

  // Drag over y Drop sobre el panel lateral derecho
  const handleRightPanelDrop = async (e) => {
    e.preventDefault();
    setIsRightDragOver(false);
    if (!selectedNode || !selectedNode.attributes?.id) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      await uploadMultipleFilesToNode(files, selectedNode.attributes.id);
    }
  };

  // 8. Exportar Inventario CSV
  const handleExportCSV = () => {
    if (!selectedNode) return;
    window.open(`${API_BASE_URL}/nodos/${selectedNode.attributes.id}/reporte`, '_blank');
  };

  // 9. Descargar QR PNG
  const handleDownloadQr = async () => {
    if (!selectedNode) return;
    try {
      const response = await fetch(`${API_BASE_URL}/nodos/${selectedNode.attributes.id}/qr`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `QR_${selectedNode.attributes.codigo}.png`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert("Error al descargar el código QR.");
    }
  };

  // ============================================================================
  // WORKFLOW: CAMBIO DE ESTADO EN CALIENTE (VALIDADOS POR FSM)
  // ============================================================================

  const handleChangeNodeEstado = async (estadoId) => {
    if (!selectedNode || userRol !== 'admin') return;
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/nodos/${selectedNode.attributes.id}/estado?estado_id=${estadoId || ''}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleSessionExpired();
        return;
      }
      if (res.ok) {
        const updatedNode = await res.json();
        setSelectedNode(prev => ({
          ...prev,
          attributes: {
            ...prev.attributes,
            estado_nombre: updatedNode.estado ? updatedNode.estado.nombre : null,
            estado_color: updatedNode.estado ? updatedNode.estado.color : null
          }
        }));
        await fetchTreeData();
        setTreeKey(prev => prev + 1);
      } else {
        const errData = await res.json();
        triggerNotification("Transición de Estado Bloqueada", errData.detail || "No permitida por las reglas de flujo.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const obtenerTodasLasSubcategoriasNames = () => {
    const nombres = [];
    const recorrer = (n) => {
      if (n) {
        if (n.name && n.attributes?.tipo !== 'Sistema') {
          nombres.push(n.name);
        }
        if (n.children) {
          n.children.forEach(recorrer);
        }
      }
    };
    if (treeData) recorrer(treeData);
    return Array.from(new Set(nombres)).sort();
  };

  const obtenerArbolFiltrado = () => {
    if (!treeData) return null;

    if (!filterEstado && filterTipo === 'todos' && !filterPersona) {
      return treeData;
    }

    const coincidenFiltros = (n) => {
      if (n.attributes?.es_archivo) {
        if (filterTipo === 'categoria') return false;
        if (filterEstado && n.attributes.estado_nombre !== filterEstado) return false;
        if (filterPersona) {
          const persId = parseInt(filterPersona);
          if (!n.attributes.personas_vinculadas_ids?.includes(persId)) return false;
        }
        return true;
      }
      
      if (filterTipo === 'archivo') return false;
      if (filterEstado && n.attributes?.estado_nombre && n.attributes.estado_nombre !== filterEstado) return false;
      
      return true;
    };

    const filtrarNodo = (nodo) => {
      const esSistema = nodo.attributes?.tipo === 'Sistema';
      const coincidenciaDirecta = coincidenFiltros(nodo);

      let hijosFiltrados = [];
      if (nodo.children) {
        hijosFiltrados = nodo.children
          .map(filtrarNodo)
          .filter(child => child !== null);
      }

      if (esSistema) {
        return hijosFiltrados.length > 0 ? { ...nodo, children: hijosFiltrados } : null;
      }

      if (!coincidenciaDirecta && hijosFiltrados.length === 0) {
        return null;
      }

      return {
        ...nodo,
        children: hijosFiltrados
      };
    };

    return filtrarNodo(treeData);
  };

  // AGREGAR / ELIMINAR ETIQUETAS DEL NODO
  const handleAddEtiquetaSubmit = async (e) => {
    e.preventDefault();
    if (!selectedNode || !newEtiquetaInput.trim() || userRol !== 'admin') return;
    
    const tag = newEtiquetaInput.trim();
    const etiquetasActuales = selectedNode.attributes?.etiquetas || [];
    if (etiquetasActuales.includes(tag)) {
      setNewEtiquetaInput('');
      return;
    }

    const nuevasEtiquetas = [...etiquetasActuales, tag];

    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/nodos/${selectedNode.attributes.id}/etiquetas`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ etiquetas: nuevasEtiquetas })
      });
      if (res.ok) {
        setSelectedNode(prev => ({
          ...prev,
          attributes: {
            ...prev.attributes,
            etiquetas: nuevasEtiquetas
          }
        }));
        setNewEtiquetaInput('');
        triggerNotification("Etiqueta Agregada", `Se asoció "${tag}" a esta subcategoría.`);
        await fetchTreeData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveEtiqueta = async (tag) => {
    if (!selectedNode || userRol !== 'admin') return;
    const etiquetasActuales = selectedNode.attributes?.etiquetas || [];
    const nuevasEtiquetas = etiquetasActuales.filter(t => t !== tag);

    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/nodos/${selectedNode.attributes.id}/etiquetas`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ etiquetas: nuevasEtiquetas })
      });
      if (res.ok) {
        setSelectedNode(prev => ({
          ...prev,
          attributes: {
            ...prev.attributes,
            etiquetas: nuevasEtiquetas
          }
        }));
        triggerNotification("Etiqueta Removida", `Se eliminó "${tag}" del nodo.`);
        await fetchTreeData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeDocumentEstado = async (docId, estadoId) => {
    if (userRol !== 'admin') return;
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/documentos/${docId}/estado?estado_id=${estadoId || ''}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleSessionExpired();
        return;
      }
      if (res.ok) {
        if (selectedNode && selectedNode.attributes?.id) {
          await fetchDocuments(selectedNode.attributes.id);
        }
        await fetchTreeData();
        setTreeKey(prev => prev + 1);
      } else {
        const errData = await res.json();
        triggerNotification("Transición de Estado Bloqueada", errData.detail || "No permitida por la máquina de estados.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Crear nuevo estado del workflow (Admin)
  const handleCreateEstado = async (e) => {
    e.preventDefault();
    if (!newEstadoNombre.trim()) return;

    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/estados/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: newEstadoNombre.trim(),
          color: newEstadoColor,
          secuencia: parseInt(newEstadoSecuencia),
          aplica_a: newEstadoAplicaA
        })
      });

      if (res.ok) {
        setNewEstadoNombre('');
        setNewEstadoColor('#a855f7');
        setNewEstadoSecuencia(1);
        setNewEstadoAplicaA('ambos');
        setShowAddEstadoModal(false);
        await fetchEstados();
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.detail}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar un estado de workflow (Admin)
  const handleDeleteEstado = async (estadoId, estadoNombre) => {
    setConfirmModal({
      show: true,
      title: 'Eliminar Estado de Workflow',
      message: `¿Estás seguro de que deseas eliminar permanentemente el estado "${estadoNombre}"? Las transiciones conectadas a este estado se borrarán automáticamente.`,
      requireTextConfirm: false,
      inputValue: '',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          const res = await fetch(`${API_BASE_URL}/estados/${estadoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            await fetchEstados();
            await fetchTransiciones();
            await fetchTreeData();
            setTreeKey(prev => prev + 1);
            setConfirmModal(prev => ({ ...prev, show: false }));
          } else {
            const errData = await res.json();
            alert(`Error: ${errData.detail}`);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // Crear una nueva transición / secuencia permitida
  const handleCreateTransicion = async (e) => {
    e.preventDefault();
    if (!fromEstadoId || !toEstadoId) return;
    if (fromEstadoId === toEstadoId) {
      alert("No se pueden crear transiciones circulares sobre el mismo estado.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/estados/transiciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          from_estado_id: parseInt(fromEstadoId),
          to_estado_id: parseInt(toEstadoId)
        })
      });

      if (res.ok) {
        setFromEstadoId('');
        setToEstadoId('');
        await fetchTransiciones();
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.detail}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar una transición
  const handleDeleteTransicion = async (fromId, toId) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/estados/transiciones?from_estado_id=${fromId}&to_estado_id=${toId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchTransiciones();
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.detail}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // RBAC: CAMBIO DE ROL DE USUARIO (ADMIN)
  // ============================================================================
  const handleChangeUserRol = async (userId, nuevoRol) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/usuarios/${userId}/rol?rol=${nuevoRol}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchUsuarios();
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.detail}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // OBTENER TRANSICIONES PERMITIDAS FILTRADAS PARA LA INTERFAZ
  // ============================================================================
  
  // Filtrar estados válidos para cambiar en el select (filtrado por máquina de estados y tipo)
  const getValidosEstadosSiguientes = (estadoActualNombre, aplicaA) => {
    // Si no hay estados cargados
    if (estados.length === 0) return [];
    
    // Filtrar primero los estados que aplican a este tipo de elemento
    const estadosPorTipo = estados.filter(e => e.aplica_a === aplicaA || e.aplica_a === 'ambos');
    
    // Si el elemento no tiene estado asignado actualmente, puede pasar a cualquier estado de su tipo
    if (!estadoActualNombre) return estadosPorTipo;

    const actual = estados.find(e => e.nombre === estadoActualNombre);
    if (!actual) return estadosPorTipo;

    // Buscar transiciones desde el estado actual
    const validosIds = transiciones
      .filter(t => t.from_estado_id === actual.id)
      .map(t => t.to_estado_id);

    // Retornar los objetos de estado correspondientes
    return estadosPorTipo.filter(e => validosIds.includes(e.id));
  };

  // ============================================================================
  // RENDERIZADO DEL DIAGRAMA DE ESTADOS DINÁMICO EN SVG
  // ============================================================================
  
  const renderWorkflowDiagram = () => {
    if (estados.length === 0) return null;

    // Dimensiones del SVG
    const width = 800;
    const height = 180;
    const nodeWidth = 120;
    const nodeHeight = 45;

    // Calcular posiciones de cada nodo horizontalmente de forma equidistante
    const coords = {};
    estados.forEach((est, index) => {
      const x = 80 + index * ((width - 160) / Math.max(1, estados.length - 1));
      const y = height / 2;
      coords[est.id] = { x, y };
    });

    return (
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,14,23,0.4)', borderRadius: '12px', overflow: 'hidden' }}>
        <h4 style={{ margin: 0, fontSize: '15px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Palette size={16} color="#c084fc" /> Diagrama Interactivo de Flujo de Estados (Ecosistema Archi-vite)
        </h4>
        
        <div style={{ width: '100%', overflowX: 'auto', background: '#0b0f19', borderRadius: '8px', padding: '10px 0' }}>
          <svg width={width} height={height} style={{ display: 'block', margin: '0 auto' }}>
            {/* Definir cabeceras de flechas neón (Markers) */}
            <defs>
              {estados.map(est => (
                <marker 
                  key={`arrow-${est.id}`} 
                  id={`arrow-${est.id}`} 
                  viewBox="0 0 10 10" 
                  refX="8" 
                  refY="5" 
                  markerWidth="6" 
                  markerHeight="6" 
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill={est.color} />
                </marker>
              ))}
            </defs>

            {/* Pintar las Flechas de Transición */}
            {transiciones.map((trans, idx) => {
              const from = coords[trans.from_estado_id];
              const to = coords[trans.to_estado_id];
              if (!from || !to) return null;

              const toEst = estados.find(e => e.id === trans.to_estado_id);
              const color = toEst ? toEst.color : '#a855f7';

              // Dibujar un arco curvado
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const dr = Math.sqrt(dx * dx + dy * dy) * 1.5; // Radio de curvatura
              
              // Ajustar puntos finales para no solapar los rectángulos
              const offset = 65; // Mitad del ancho del nodo + margen
              const startX = from.x + (dx > 0 ? 55 : -55);
              const startY = from.y;
              const endX = to.x - (dx > 0 ? 65 : -65);
              const endY = to.y;

              return (
                <path
                  key={`trans-${idx}`}
                  d={`M ${startX} ${startY} A ${dr} ${dr} 0 0 1 ${endX} ${endY}`}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  markerEnd={`url(#arrow-${trans.to_estado_id})`}
                  style={{ filter: `drop-shadow(0 0 4px ${color})`, opacity: 0.85 }}
                />
              );
            })}

            {/* Pintar los Nodos (Estados) */}
            {estados.map((est) => {
              const pos = coords[est.id];
              if (!pos) return null;

              // Diferenciar íconos por aplicación
              const aplicaTxt = est.aplica_a === 'categoria' ? '📁 Cat' : est.aplica_a === 'archivo' ? '📄 Arc' : '🔄 Ambos';

              return (
                <g key={`node-${est.id}`} transform={`translate(${pos.x - nodeWidth / 2}, ${pos.y - nodeHeight / 2})`}>
                  {/* Borde Neón */}
                  <rect
                    width={nodeWidth}
                    height={nodeHeight}
                    rx="8"
                    fill="#101424"
                    stroke={est.color}
                    strokeWidth="2"
                    style={{ filter: `drop-shadow(0 0 5px ${est.color}44)` }}
                  />
                  {/* Nombre */}
                  <text
                    x={nodeWidth / 2}
                    y="22"
                    fill="#fff"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="Outfit"
                  >
                    {est.nombre}
                  </text>
                  {/* Tipo Aplicado */}
                  <text
                    x={nodeWidth / 2}
                    y="36"
                    fill={est.color}
                    fontSize="8"
                    fontWeight="600"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {aplicaTxt}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  const toggleLocalNode = (nodeCode) => {
    setLocalExpanded(prev => ({
      ...prev,
      [nodeCode]: !prev[nodeCode]
    }));
  };

  // ============================================================================
  // PANELES DE VISTA CENTRAL CORRESPONDIENTES AL MENÚ ACTIVO
  // ============================================================================

  // 1. Dashboard de Métricas
  const renderDashboardView = () => {
    const isStatsLoading = !statsData;
    const stats = statsData || {
      total_categorias: 0,
      total_ubicaciones: 0,
      total_documentos: 0,
      distribucion: [],
      tipos_archivo: { pdf: 0, imagenes: 0, excel: 0, otros: 0 }
    };

    // Calcular metadatos del repositorio
    const totalDocsCount = typeof stats.total_documentos === 'number' ? stats.total_documentos : 0;
    const totalBytes = totalDocsCount * 184510; // Tamaño aproximado simulado (180kb por PDF)
    const repoSizeFormatted = totalBytes > 1024 * 1024 
      ? `${(totalBytes / (1024 * 1024)).toFixed(1)} MB` 
      : `${(totalBytes / 1024).toFixed(0)} KB`;

    // Distribución 100% real de la base de datos
    const distribucionReal = stats.distribucion || [];
    const totalDocumentosStats = totalDocsCount;

    return (
      <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-color-main)' }}>Dashboard de Gestión Documental</h2>
            <span style={{ fontSize: '13px', color: 'var(--text-color-muted)' }}>Estadísticas globales de Archi-vite</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {isStatsLoading && (
              <div style={{ padding: '6px 14px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', fontSize: '12px', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }} className="pulse-glow">
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7', display: 'inline-block' }} />
                Cargando métricas...
              </div>
            )}
            <div style={{ padding: '6px 14px', background: 'var(--bg-color-card)', border: '1px solid var(--border-color-card)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-color-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isStatsLoading ? '#eab308' : '#22c55e', display: 'inline-block' }} />
              {isStatsLoading ? 'Sincronizando...' : 'Sincronizado con PostgreSQL'}
            </div>
          </div>
        </div>

        {/* Tarjetas Gigantes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(168, 85, 247, 0.25)', boxShadow: '0 0 15px rgba(168,85,247,0.05)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.05, color: '#fff' }}><Folder size={80} /></div>
            <span style={{ fontSize: '12px', color: 'var(--text-color-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categorías Lógicas</span>
            <h3 style={{ margin: '8px 0 0 0', fontSize: '36px', color: 'var(--primary-glow)', fontWeight: 700 }}>{isStatsLoading ? 'Cargando...' : stats.total_categorias}</h3>
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Estructura de taxonomías activas</span>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(34, 197, 94, 0.25)', boxShadow: '0 0 15px rgba(34,197,94,0.05)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.05, color: '#fff' }}><MapPin size={80} /></div>
            <span style={{ fontSize: '12px', color: 'var(--text-color-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ubicaciones Físicas</span>
            <h3 style={{ margin: '8px 0 0 0', fontSize: '36px', color: '#22c55e', fontWeight: 700 }}>{isStatsLoading ? 'Cargando...' : stats.total_ubicaciones}</h3>
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Archivadores y depósitos</span>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(239, 68, 68, 0.25)', boxShadow: '0 0 15px rgba(239,68,68,0.05)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.05, color: '#fff' }}><FileText size={80} /></div>
            <span style={{ fontSize: '12px', color: 'var(--text-color-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Archivos DMS</span>
            <h3 style={{ margin: '8px 0 0 0', fontSize: '36px', color: '#f87171', fontWeight: 700 }}>{isStatsLoading ? 'Cargando...' : stats.total_documentos}</h3>
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Documentos digitales firmados</span>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(6, 182, 212, 0.25)', boxShadow: '0 0 15px rgba(6,182,212,0.05)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.05, color: '#fff' }}><Database size={80} /></div>
            <span style={{ fontSize: '12px', color: 'var(--text-color-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Espacio Usado</span>
            <h3 style={{ margin: '8px 0 0 0', fontSize: '36px', color: '#06b6d4', fontWeight: 700 }}>{isStatsLoading ? 'Cargando...' : (stats.total_documentos > 0 ? repoSizeFormatted : '0 KB')}</h3>
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Media y metadatos DMS</span>
            </div>
          </div>
        </div>

        {/* Distribución y Logs Recientes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          
          {/* Distribución por Nodos con Barras de Progreso Neón */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-color-main)', fontWeight: 600 }}>Distribución de Documentación por Nodos</h4>
              <span style={{ fontSize: '11px', color: 'var(--text-color-muted)' }}>Proporción real en DMS</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {distribucionReal.length > 0 ? (
                distribucionReal.map((dist, idx) => {
                  const percentage = Math.min(100, (dist.documentos / (totalDocumentosStats || 1)) * 100);
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-color-main)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: idx % 2 === 0 ? 'var(--primary-glow)' : 'var(--secondary-glow)' }} />
                          {dist.name}
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--primary-glow)' }}>{dist.documentos} archivos ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div style={{ height: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color-card)', borderRadius: '6px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: `${percentage}%`, 
                            height: '100%', 
                            background: `linear-gradient(to right, var(--primary-glow), var(--secondary-glow))`, 
                            borderRadius: '6px',
                            boxShadow: `0 0 8px var(--primary-glow)`,
                            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                          }} 
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#475569', padding: '40px 0' }}>
                  <Folder size={32} color="#1e293b" />
                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>Crea tu primera categoría para ver su distribución.</span>
                </div>
              )}
            </div>
          </div>

          {/* Gráfico Donut de Tipos de Documento en SVG */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-color-main)', fontWeight: 600 }}>Tipos de Archivo Registrados</h4>
              <span style={{ fontSize: '11px', color: 'var(--text-color-muted)' }}>Sectores neón</span>
            </div>

            {(() => {
              const pdfs = stats.tipos_archivo?.pdf || 0;
              const imagenes = stats.tipos_archivo?.imagenes || 0;
              const excel = stats.tipos_archivo?.excel || 0;
              const otros = stats.tipos_archivo?.otros || 0;
              const total = pdfs + imagenes + excel + otros;
              
              const pctPdf = total > 0 ? pdfs / total : 0;
              const pctImg = total > 0 ? imagenes / total : 0;
              const pctXls = total > 0 ? excel / total : 0;
              const pctOtr = total > 0 ? otros / total : 0;
              
              const lenPdf = pctPdf * 314.16;
              const lenImg = pctImg * 314.16;
              const lenXls = pctXls * 314.16;
              const lenOtr = pctOtr * 314.16;
              
              const offPdf = 0;
              const offImg = -lenPdf;
              const offXls = -(lenPdf + lenImg);
              const offOtr = -(lenPdf + lenImg + lenXls);
              
              return (
                <div style={{ display: 'flex', gap: '30px', alignItems: 'center', justifyContent: 'center', width: '100%', flex: 1, marginTop: '10px' }}>
                  {/* Gráfico Donut de SVG */}
                  <svg width="150" height="150" viewBox="0 0 150 150">
                    <circle cx="75" cy="75" r="50" fill="transparent" stroke="rgba(255,255,255,0.02)" strokeWidth="18" />
                    {total === 0 ? (
                      <circle cx="75" cy="75" r="50" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="18" />
                    ) : (
                      <>
                        {lenPdf > 0 && (
                          <circle cx="75" cy="75" r="50" fill="transparent" stroke="var(--primary-glow)" strokeWidth="18" 
                                  strokeDasharray={`${lenPdf} 314.16`} strokeDashoffset={offPdf} strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 5px var(--primary-glow))', transition: 'all 0.5s' }} />
                        )}
                        {lenImg > 0 && (
                          <circle cx="75" cy="75" r="50" fill="transparent" stroke="var(--secondary-glow)" strokeWidth="18" 
                                  strokeDasharray={`${lenImg} 314.16`} strokeDashoffset={offImg} strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 5px var(--secondary-glow))', transition: 'all 0.5s' }} />
                        )}
                        {lenXls > 0 && (
                          <circle cx="75" cy="75" r="50" fill="transparent" stroke="#22c55e" strokeWidth="18" 
                                  strokeDasharray={`${lenXls} 314.16`} strokeDashoffset={offXls} strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 5px #22c55e)', transition: 'all 0.5s' }} />
                        )}
                        {lenOtr > 0 && (
                          <circle cx="75" cy="75" r="50" fill="transparent" stroke="#06b6d4" strokeWidth="18" 
                                  strokeDasharray={`${lenOtr} 314.16`} strokeDashoffset={offOtr} strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 5px #06b6d4)', transition: 'all 0.5s' }} />
                        )}
                      </>
                    )}
                    <text x="75" y="79" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700" fontFamily="Outfit">
                      {total} Docs
                    </text>
                  </svg>

                  {/* Leyenda */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-glow)' }} />
                      <span style={{ color: '#fff', fontWeight: 600 }}>PDF Académicos ({pdfs} · {(pctPdf * 100).toFixed(0)}%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--secondary-glow)' }} />
                      <span style={{ color: '#fff', fontWeight: 600 }}>Anexos e Imágenes ({imagenes} · {(pctImg * 100).toFixed(0)}%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                      <span style={{ color: '#fff', fontWeight: 600 }}>Hojas de Cálculo ({excel} · {(pctXls * 100).toFixed(0)}%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4' }} />
                      <span style={{ color: '#fff', fontWeight: 600 }}>Registros y Otros ({otros} · {(pctOtr * 100).toFixed(0)}%)</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

        </div>

        {/* Segunda Fila: Actividad Semanal e Historial de Operaciones */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          
          {/* Gráfico de Líneas de Actividad Semanal */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-color-main)', fontWeight: 600 }}>Tendencia de Actividad Semanal</h4>
              <span style={{ fontSize: '11px', color: 'var(--text-color-muted)' }}>Cargas de archivos por día</span>
            </div>

            {/* Gráfico de Líneas SVG Neón */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'center' }}>
              <svg viewBox="0 0 500 160" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary-glow)" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="var(--primary-glow)" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>
                {/* Cuadrícula de Fondo */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                <line x1="0" y1="70" x2="500" y2="70" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                <line x1="0" y1="110" x2="500" y2="110" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                
                {/* Área bajo la curva */}
                <path d="M 10 140 Q 90 80, 170 110 T 330 90 T 490 150 L 490 150 L 10 150 Z" fill="url(#areaGradient)" />
                
                {/* Línea de tendencia neón */}
                <path d="M 10 140 Q 90 80, 170 110 T 330 90 T 490 150" fill="none" stroke="var(--primary-glow)" strokeWidth="3.5" style={{ filter: 'drop-shadow(0 0 6px var(--primary-glow))' }} />

                {/* Nodos de puntos brillantes */}
                <circle cx="10" cy="140" r="5" fill="#fff" stroke="var(--primary-glow)" strokeWidth="2.5" />
                <circle cx="90" cy="80" r="5" fill="#fff" stroke="var(--primary-glow)" strokeWidth="2.5" />
                <circle cx="170" cy="110" r="5" fill="#fff" stroke="var(--primary-glow)" strokeWidth="2.5" />
                <circle cx="250" cy="50" r="5" fill="#fff" stroke="var(--primary-glow)" strokeWidth="2.5" />
                <circle cx="330" cy="90" r="5" fill="#fff" stroke="var(--primary-glow)" strokeWidth="2.5" />
                <circle cx="410" cy="130" r="5" fill="#fff" stroke="var(--primary-glow)" strokeWidth="2.5" />
                <circle cx="490" cy="150" r="5" fill="#fff" stroke="var(--primary-glow)" strokeWidth="2.5" />

                {/* Etiquetas de días de la semana */}
                <text x="10" y="158" fill="var(--text-color-muted)" fontSize="9" textAnchor="middle">Lun</text>
                <text x="90" y="158" fill="var(--text-color-muted)" fontSize="9" textAnchor="middle">Mar</text>
                <text x="170" y="158" fill="var(--text-color-muted)" fontSize="9" textAnchor="middle">Mié</text>
                <text x="250" y="158" fill="var(--text-color-muted)" fontSize="9" textAnchor="middle">Jue</text>
                <text x="330" y="158" fill="var(--text-color-muted)" fontSize="9" textAnchor="middle">Vie</text>
                <text x="410" y="158" fill="var(--text-color-muted)" fontSize="9" textAnchor="middle">Sáb</text>
                <text x="490" y="158" fill="var(--text-color-muted)" fontSize="9" textAnchor="middle">Dom</text>
              </svg>
            </div>
          </div>

          {/* Últimas Operaciones */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '250px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-color-main)', fontWeight: 600 }}>Últimas Operaciones</h4>
              <span style={{ fontSize: '11px', color: 'var(--text-color-muted)' }}>Logs de auditoría</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', paddingRight: '4px' }}>
              {auditLogs.length === 0 ? (
                <div style={{ padding: '10px', background: 'var(--bg-color-card)', border: '1px dashed var(--border-color-card)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-color-muted)', textAlign: 'center' }}>
                  No se registran logs de auditoría aún.
                </div>
              ) : (
                auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} style={{ padding: '12px', background: 'var(--bg-color-card)', border: '1px solid var(--border-color-card)', borderRadius: '8px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-color-muted)', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--primary-glow)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        👤 {log.usuario}
                      </span>
                      <span>{new Date(log.creado_en).toLocaleTimeString()}</span>
                    </div>
                    <span style={{ color: 'var(--text-color-main)', fontFamily: 'monospace', fontSize: '11.5px' }}>{log.accion}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    );
  };

  // 9. Centro de Reportes Analíticos
  const renderReportesView = () => {
    if (!reportesEstadisticas) return <div style={{ color: '#8f9cae', padding: '40px' }}>Cargando datos de reportes analíticos...</div>;

    const {
      distribucion_formatos,
      distribucion_deptos,
      ocupacion_fisica,
      historico_actividad,
      total_documentos,
      total_alertas,
      total_nodos_fisicos
    } = reportesEstadisticas;

    const handleExportReportesCSV = () => {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Reporte Analitico de Gestion Documental - Archi-vite\n";
      csvContent += `Fecha: ${new Date().toLocaleString()}\n`;
      csvContent += `Total Documentos: ${total_documentos}\n`;
      csvContent += `Total Alertas de Retencion: ${total_alertas}\n`;
      csvContent += `Total Ubicaciones Fisicas: ${total_nodos_fisicos}\n\n`;

      csvContent += "--- DISTRIBUCION POR FORMATOS ---\nName,Count\n";
      distribucion_formatos.forEach(item => {
        csvContent += `${item.name},${item.value}\n`;
      });

      csvContent += "\n--- DISTRIBUCION POR DEPARTAMENTO ---\nDepartamento,Documentos Vinculados\n";
      distribucion_deptos.forEach(item => {
        csvContent += `"${item.name}",${item.value}\n`;
      });

      csvContent += "\n--- OCUPACION DE ARCHIVO FISICO ---\nUbicacion,Codigo,Ocupado,Capacidad,Porcentaje\n";
      ocupacion_fisica.forEach(item => {
        csvContent += `"${item.nombre}",${item.codigo},${item.ocupado},${item.capacidad},${item.porcentaje}%\n`;
      });

      csvContent += "\n--- HISTORICO DE EVENTOS (ULTIMOS 7 DIAS) ---\nFecha,Eventos Registrados\n";
      historico_actividad.forEach(item => {
        csvContent += `${item.fecha},${item.eventos}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Reporte_Analitico_ArchiVite_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerNotification("Reporte CSV", "Descarga de reporte analítico iniciada.");
    };

    const handlePrintPDF = () => {
      window.print();
    };

    return (
      <div 
        id="reportes-view-container" 
        style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #reportes-view-container, #reportes-view-container * {
              visibility: visible;
            }
            #reportes-view-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0px !important;
              background: #fff !important;
              color: #000 !important;
            }
            .no-print {
              display: none !important;
            }
            .print-header {
              display: flex !important;
              flex-direction: column;
              border-bottom: 2px solid #000;
              padding-bottom: 12px;
              margin-bottom: 24px;
            }
            .glass-panel {
              background: none !important;
              border: 1px solid #ddd !important;
              box-shadow: none !important;
              color: #000 !important;
            }
            h2, h3, h4, span, div {
              color: #000 !important;
              text-shadow: none !important;
            }
            .progress-fill {
              background: #000 !important;
              box-shadow: none !important;
            }
          }
        `}} />

        <div className="print-header" style={{ display: 'none', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800 }}>REPORTE ANALÍTICO DE INFRAESTRUCTURA DMS</h1>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Proyecto de Grado - Archi-vite</span>
          </div>
          <span style={{ fontSize: '12px', color: '#555' }}>
            Generado automáticamente el: {new Date().toLocaleString()} · Responsable: {username} ({userRol === 'admin' ? 'Administrador' : 'Lector'})
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-color-main)' }}>Centro de Reportes Analíticos</h2>
            <span style={{ fontSize: '13px', color: 'var(--text-color-muted)' }}>Métricas de taxonomías, ciclos de retención y auditoría activa</span>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleExportReportesCSV}
              className="glass-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#fff',
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <FileSpreadsheet size={15} color="#22c55e" /> Exportar CSV
            </button>
            <button
              onClick={handlePrintPDF}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Download size={15} /> Generar Reporte PDF
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total de Documentos DMS</span>
            <h3 style={{ margin: 0, fontSize: '32px', color: 'var(--primary-glow)', fontWeight: 700 }}>{total_documentos}</h3>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Hojas de cálculo, PDFs e imágenes</span>
          </div>
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Alertas de Retención Activas</span>
            <h3 style={{ margin: 0, fontSize: '32px', color: '#ef4444', fontWeight: 700 }}>{total_alertas}</h3>
            <span style={{ fontSize: '11px', color: '#f87171' }}>Próximos a purgar/transferir</span>
          </div>
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Ubicaciones Físicas</span>
            <h3 style={{ margin: 0, fontSize: '32px', color: '#22c55e', fontWeight: 700 }}>{total_nodos_fisicos}</h3>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Estantes, archivadores y depósitos</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#fff', fontWeight: 600 }}>Distribución por Formato de Archivo</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {distribucion_formatos.length > 0 ? (
                distribucion_formatos.map((item, idx) => {
                  const pct = total_documentos > 0 ? (item.value / total_documentos) * 100 : 0;
                  const colors = ['#a855f7', '#06b6d4', '#22c55e', '#eab308', '#64748b'];
                  const color = colors[idx % colors.length];
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                          {item.name}
                        </span>
                        <span style={{ fontWeight: 600, color }}>{item.value} archivos ({pct.toFixed(0)}%)</span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div className="progress-fill" style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', boxShadow: `0 0 6px ${color}55` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px', color: '#64748b', fontSize: '12px' }}>
                  Sin archivos registrados.
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#fff', fontWeight: 600 }}>Volumen Documental por Área o Departamento</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {distribucion_deptos.length > 0 ? (
                distribucion_deptos.map((item, idx) => {
                  const maxVal = Math.max(...distribucion_deptos.map(d => d.value), 1);
                  const pct = (item.value / maxVal) * 100;
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: '#cbd5e1' }}>💼 {item.name}</span>
                        <span style={{ fontWeight: 600, color: 'var(--primary-glow)' }}>{item.value} vínculos</span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div className="progress-fill" style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(to right, #a855f7, #6366f1)', borderRadius: '4px', boxShadow: '0 0 6px rgba(168,85,247,0.3)' }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px', color: '#64748b', fontSize: '12px' }}>
                  Sin personas vinculadas registradas.
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#fff', fontWeight: 600 }}>Ocupación de Almacenamiento Físico</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {ocupacion_fisica.length > 0 ? (
                ocupacion_fisica.map((item, idx) => {
                  const statusColor = item.porcentaje > 80 ? '#ef4444' : item.porcentaje > 50 ? '#eab308' : '#22c55e';
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: '#cbd5e1', fontWeight: 500 }}>📍 {item.nombre} ({item.codigo})</span>
                        <span style={{ fontWeight: 600, color: statusColor }}>{item.ocupado}/{item.capacidad} ({item.porcentaje}%)</span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div className="progress-fill" style={{ width: `${item.porcentaje}%`, height: '100%', background: statusColor, borderRadius: '4px', boxShadow: `0 0 6px ${statusColor}44` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px', color: '#64748b', fontSize: '12px' }}>
                  No se han registrado contenedores físicos.
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#fff', fontWeight: 600 }}>Operaciones en los Últimos 7 Días</h4>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '120px', padding: '10px 10px 0 10px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              {historico_actividad.length > 0 ? (
                historico_actividad.map((day, idx) => {
                  const maxEvents = Math.max(...historico_actividad.map(d => d.eventos), 1);
                  const heightPct = (day.eventos / maxEvents) * 90;
                  const formattedDate = day.fecha.split('-').slice(1).join('/');
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1, position: 'relative' }}>
                      {day.eventos > 0 && (
                        <span style={{ fontSize: '9px', color: '#c084fc', position: 'absolute', top: `calc(-20px - ${heightPct}%)`, fontWeight: 700 }}>
                          {day.eventos}
                        </span>
                      )}
                      <div 
                        style={{ 
                          width: '18px', 
                          height: `${Math.max(4, heightPct)}%`, 
                          background: 'linear-gradient(to top, #06b6d4, #a855f7)', 
                          borderRadius: '3px 3px 0 0',
                          boxShadow: '0 0 8px rgba(6, 182, 212, 0.4)',
                          transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} 
                        title={`${day.eventos} eventos registrados`}
                      />
                      <span style={{ fontSize: '8px', color: '#8f9cae', fontFamily: 'monospace' }}>{formattedDate}</span>
                    </div>
                  );
                })
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px', color: '#64748b', fontSize: '12px', width: '100%' }}>
                  Sin actividad registrada esta semana.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 2. Configuración de Workflow y Secuencias (FSM)
  const renderWorkflowView = () => {
    return (
      <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#fff' }}>Flujo de Trabajo (Workflow)</h2>
            <span style={{ fontSize: '13px', color: '#8f9cae' }}>Configura el ciclo de vida y las transiciones válidas</span>
          </div>
          {userRol === 'admin' && (
            <button 
              onClick={() => setShowAddEstadoModal(true)}
              className="btn-primary"
              style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <Plus size={16} /> Nuevo Estado
            </button>
          )}
        </div>

        {/* Renderizado del Diagrama SVG */}
        {renderWorkflowDiagram()}

        {/* Conexión de Transiciones */}
        {userRol === 'admin' && (
          <form onSubmit={handleCreateTransicion} className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Conectar Flujo:</span>
            
            <select 
              value={fromEstadoId} 
              onChange={(e) => setFromEstadoId(e.target.value)} 
              required
              style={{ background: '#121624', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', padding: '8px 12px', fontSize: '12px' }}
            >
              <option value="">-- Desde Estado --</option>
              {estados.map(e => (
                <option key={`from-${e.id}`} value={e.id}>{e.nombre} ({e.aplica_a})</option>
              ))}
            </select>

            <ArrowRight size={18} color="#cbd5e1" />

            <select 
              value={toEstadoId} 
              onChange={(e) => setToEstadoId(e.target.value)} 
              required
              style={{ background: '#121624', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', padding: '8px 12px', fontSize: '12px' }}
            >
              <option value="">-- Hacia Estado --</option>
              {estados.map(e => (
                <option key={`to-${e.id}`} value={e.id}>{e.nombre} ({e.aplica_a})</option>
              ))}
            </select>

            <button type="submit" className="btn-primary" style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              Establecer Secuencia
            </button>
          </form>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          
          {/* Tabla de Estados */}
          <div className="glass-panel" style={{ padding: '0', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#fff', fontWeight: 600 }}>Estados Habilitados</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#cbd5e1', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <th style={{ padding: '12px 20px' }}>Orden</th>
                  <th style={{ padding: '12px 20px' }}>Nombre</th>
                  <th style={{ padding: '12px 20px' }}>Aplica A</th>
                  {userRol === 'admin' && <th style={{ padding: '12px 20px', textAlign: 'right' }}>Eliminar</th>}
                </tr>
              </thead>
              <tbody>
                {estados.map((est) => (
                  <tr key={est.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px 20px', fontFamily: 'monospace' }}>#{est.secuencia}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ border: `1.5px solid ${est.color}`, color: est.color, padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
                        {est.nombre}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', textTransform: 'capitalize', color: '#8f9cae' }}>{est.aplica_a === 'ambos' ? 'Categorías y Archivos' : est.aplica_a === 'categoria' ? 'Categorías' : 'Archivos DMS'}</td>
                    {userRol === 'admin' && (
                      <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                        <button onClick={() => handleDeleteEstado(est.id, est.nombre)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                          <Trash2 size={14} color="#f87171" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Listado de Transiciones */}
          <div className="glass-panel" style={{ padding: '0', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#fff', fontWeight: 600 }}>Secuencias Permitidas</div>
            <div style={{ maxHeight: '250px', overflowY: 'auto', padding: '10px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {transiciones.length > 0 ? (
                transiciones.map((trans) => {
                  const from = estados.find(e => e.id === trans.from_estado_id);
                  const to = estados.find(e => e.id === trans.to_estado_id);
                  if (!from || !to) return null;
                  return (
                    <div key={trans.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: from.color, fontWeight: 700 }}>{from.nombre}</span>
                        <ArrowRight size={12} color="#64748b" />
                        <span style={{ color: to.color, fontWeight: 700 }}>{to.nombre}</span>
                      </div>
                      {userRol === 'admin' && (
                        <button onClick={() => handleDeleteTransicion(trans.from_estado_id, trans.to_estado_id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                          <X size={14} color="#f87171" />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '20px', color: '#64748b', textAlign: 'center' }}>No hay transiciones configuradas.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  };

  // 3. Usuarios & Roles (RBAC) y Directorio de Personas
  const renderUsuariosView = () => {
    return (
      <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#fff' }}>Usuarios y Directorios</h2>
            <span style={{ fontSize: '13px', color: '#8f9cae' }}>Gestión de accesos, seguridad y catálogo centralizado de personas</span>
          </div>
          
          {userRol === 'admin' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setShowRolesConfigModal(true)} 
                className="glass-card"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}
              >
                <Settings size={16} color="#c084fc" /> Configurar Roles
              </button>
              {activeUsuariosTab === 'directorio' && (
                <button 
                  onClick={() => setShowCreatePersonaModal(true)} 
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}
                >
                  <UserPlus size={16} /> Registrar Nueva Persona
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pestañas Neón */}
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '2px' }}>
          <button
            onClick={() => setActiveUsuariosTab('roles')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeUsuariosTab === 'roles' ? '2px solid #a855f7' : '2px solid transparent',
              color: activeUsuariosTab === 'roles' ? '#fff' : '#8f9cae',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              outline: 'none'
            }}
          >
            <Key size={15} color={activeUsuariosTab === 'roles' ? '#a855f7' : '#8f9cae'} />
            Roles & Permisos (RBAC)
          </button>
          <button
            onClick={() => setActiveUsuariosTab('directorio')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeUsuariosTab === 'directorio' ? '2px solid #a855f7' : '2px solid transparent',
              color: activeUsuariosTab === 'directorio' ? '#fff' : '#8f9cae',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              outline: 'none'
            }}
          >
            <Users size={15} color={activeUsuariosTab === 'directorio' ? '#a855f7' : '#8f9cae'} />
            Directorio de Personas
          </button>
        </div>

        {activeUsuariosTab === 'roles' ? (
          <div className="glass-panel" style={{ padding: '0', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#cbd5e1', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#fff' }}>
                  <th style={{ padding: '16px 20px' }}>ID</th>
                  <th style={{ padding: '16px 20px' }}>Usuario</th>
                  <th style={{ padding: '16px 20px' }}>Rol Asignado</th>
                  <th style={{ padding: '16px 20px' }}>Fecha de Registro</th>
                  {userRol === 'admin' && <th style={{ padding: '16px 20px', textAlign: 'right' }}>Modificar Rol</th>}
                </tr>
              </thead>
              <tbody>
                {usuarios.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="hover-scale">
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace' }}>{user.id}</td>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: '#fff' }}>{user.username}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span 
                        style={{ 
                          background: user.rol === 'admin' ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.03)', 
                          color: user.rol === 'admin' ? '#c084fc' : '#8f9cae', 
                          padding: '4px 10px', 
                          borderRadius: '6px', 
                          fontSize: '11px', 
                          fontWeight: 600,
                          border: user.rol === 'admin' ? '1px solid rgba(168,85,247,0.2)' : '1px solid rgba(255,255,255,0.05)',
                          textTransform: 'uppercase'
                        }}
                      >
                        {user.rol}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>{new Date(user.creado_en).toLocaleDateString()}</td>
                    {userRol === 'admin' && (
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <select 
                          value={user.rol}
                          onChange={(e) => handleChangeUserRol(user.id, e.target.value)}
                          disabled={user.username === username}
                          style={{
                            background: '#1b2030',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '6px',
                            color: '#fff',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontFamily: 'Outfit',
                            outline: 'none',
                            cursor: user.username === username ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <option value="user">USER (Lector)</option>
                          <option value="admin">ADMIN (Infraestructura)</option>
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '0', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#cbd5e1', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#fff' }}>
                  <th style={{ padding: '16px 20px' }}>Identificación</th>
                  <th style={{ padding: '16px 20px' }}>Nombre Completo</th>
                  <th style={{ padding: '16px 20px' }}>Rol</th>
                  <th style={{ padding: '16px 20px' }}>Departamento / Área</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {personas.length > 0 ? (
                  personas.map((per) => {
                    const rolNombre = per.rol_actual ? per.rol_actual.nombre : 'Sin Rol';
                    const rolColor = per.rol_actual ? per.rol_actual.color : '#cbd5e1';
                    return (
                      <tr key={per.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="hover-scale">
                        <td style={{ padding: '16px 20px', fontWeight: 600, color: '#a855f7', fontFamily: 'monospace' }}>🪪 {per.identificacion}</td>
                        <td style={{ padding: '16px 20px', fontWeight: 600, color: '#fff' }}>{per.nombre_completo}</td>
                        <td style={{ padding: '16px 20px' }}>
                          <span 
                            style={{ 
                              background: `${rolColor}15`, 
                              color: rolColor, 
                              padding: '4px 10px', 
                              borderRadius: '6px', 
                              fontSize: '11px', 
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              border: `1px solid ${rolColor}33`
                            }}
                          >
                            {rolNombre}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', color: '#8f9cae' }}>{per.carrera_departamento || 'Sin especificar'}</td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <button 
                            onClick={() => fetchExpediente(per.id)}
                            style={{
                              background: 'rgba(168,85,247,0.1)',
                              border: '1px solid rgba(168,85,247,0.3)',
                              borderRadius: '6px',
                              color: '#c084fc',
                              padding: '6px 14px',
                              fontSize: '12px',
                              fontWeight: 600,
                              fontFamily: 'Outfit',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            className="hover-glow"
                          >
                            <FolderOpen size={13} />
                            Ver Expediente
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No hay personas registradas en el catálogo central.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // 4. Auditoría de Operaciones (Logs)
  const renderAuditoriaView = () => {
    const filteredLogs = auditLogs.filter(log => 
      log.usuario.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.accion.toLowerCase().includes(logSearchQuery.toLowerCase())
    );

    return (
      <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#fff' }}>Registro de Auditoría</h2>
            <span style={{ fontSize: '13px', color: '#8f9cae' }}>Acciones y transacciones del sistema</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '8px 14px', gap: '8px', width: '280px' }}>
            <Search size={14} color="#8f9cae" />
            <input 
              type="text" 
              placeholder="Buscar logs..." 
              value={logSearchQuery}
              onChange={(e) => setLogSearchQuery(e.target.value)}
              style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: '12px', width: '100%', fontFamily: 'Outfit' }}
            />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '0', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#cbd5e1', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#fff' }}>
                <th style={{ padding: '16px 20px' }}>Usuario</th>
                <th style={{ padding: '16px 20px' }}>Acción</th>
                <th style={{ padding: '16px 20px' }}>Nodo</th>
                <th style={{ padding: '16px 20px' }}>Fecha y Hora</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="hover-scale">
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: '#c084fc' }}>👤 {log.usuario}</td>
                  <td style={{ padding: '16px 20px', color: '#fff' }}>{log.accion}</td>
                  <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: '11px', color: '#8f9cae' }}>{log.codigo_nodo || '-'}</td>
                  <td style={{ padding: '16px 20px' }}>{new Date(log.creado_en).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handleSaveCodificacion = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/configuracion-codificacion/`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(configCodificacion)
      });
      if (res.ok) {
        const data = await res.json();
        setConfigCodificacion(data);
        triggerNotification("Reglas Actualizadas", "La configuración de codificación inteligente se guardó con éxito.");
        await fetchTreeData();
      } else {
        const errData = await res.json();
        triggerNotification("Error al Guardar", errData.detail || "No se pudo actualizar la configuración.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderCodificacionView = () => {
    return (
      <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#fff' }}>Parametrización de Codificación Inteligente</h2>
          <span style={{ fontSize: '13px', color: '#8f9cae' }}>Configura las reglas globales de nomenclatura para las subcategorías lógicas y físicas.</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
          
          {/* Formulario de Configuración */}
          <form onSubmit={handleSaveCodificacion} className="glass-panel" style={{ padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#c084fc', fontWeight: 600 }}>⚙️ Reglas de Generación</h3>
            
            {/* Prefijo Global */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#8f9cae', fontWeight: 500 }}>Prefijo Global Fijo:</span>
              <input 
                type="text" 
                placeholder="Ej: UAGRM, AV, vacio..."
                value={configCodificacion?.prefijo_global || ''}
                onChange={(e) => setConfigCodificacion({...configCodificacion, prefijo_global: e.target.value})}
                style={{ background: '#121624', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', fontFamily: 'Outfit', outline: 'none' }}
              />
            </div>

            {/* Separador */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#8f9cae', fontWeight: 500 }}>Separador de Niveles:</span>
              <select 
                value={configCodificacion?.separador || '-'}
                onChange={(e) => setConfigCodificacion({...configCodificacion, separador: e.target.value})}
                style={{ background: '#121624', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', fontFamily: 'Outfit', outline: 'none', cursor: 'pointer' }}
              >
                <option value="-">Guion medio ( - )</option>
                <option value=".">Punto ( . )</option>
                <option value="/">Barra ( / )</option>
                <option value="_">Guion bajo ( _ )</option>
                <option value="">Sin separador (junto)</option>
              </select>
            </div>

            {/* Dígitos Correlativo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#8f9cae', fontWeight: 500 }}>Longitud del Correlativo:</span>
              <select 
                value={configCodificacion?.digitos_correlativo || 3}
                onChange={(e) => setConfigCodificacion({...configCodificacion, digitos_correlativo: parseInt(e.target.value)})}
                style={{ background: '#121624', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', fontFamily: 'Outfit', outline: 'none', cursor: 'pointer' }}
              >
                <option value={2}>2 Dígitos (ej: 01)</option>
                <option value={3}>3 Dígitos (ej: 001)</option>
                <option value={4}>4 Dígitos (ej: 0001)</option>
              </select>
            </div>

            {/* Usar código del padre */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '12px', color: '#fff', fontWeight: 500 }}>Estructura Jerárquica Hereditaria</span>
                <span style={{ fontSize: '10px', color: '#8f9cae' }}>Incluye el código del padre en los códigos hijos.</span>
              </div>
              <input 
                type="checkbox" 
                checked={configCodificacion?.usar_abreviacion_padre || false}
                onChange={(e) => setConfigCodificacion({...configCodificacion, usar_abreviacion_padre: e.target.checked})}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#a855f7' }}
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary"
              style={{ padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginTop: '10px' }}
            >
              Guardar Configuración
            </button>
          </form>

          {/* Panel Explicativo */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#22c55e', fontWeight: 600 }}>💡 Previsualización de Código Inteligente</h3>
            
            <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 10px 0' }}>El sistema generará los códigos de las nuevas categorías utilizando la siguiente fórmula:</p>
              
              <div style={{ background: '#121624', padding: '14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px', border: '1px solid rgba(255,255,255,0.04)', color: '#a855f7', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>Fórmula General:</div>
                <div style={{ color: '#fff', fontWeight: 600 }}>
                  {configCodificacion?.prefijo_global ? `[${configCodificacion.prefijo_global}]` : ''}
                  {configCodificacion?.usar_abreviacion_padre ? '[CÓDIGO_PADRE]' : ''}
                  {configCodificacion?.separador ? `[${configCodificacion.separador}]` : ''}
                  [ABREVIACIÓN]
                  {configCodificacion?.separador ? `[${configCodificacion.separador}]` : ''}
                  [{'0'.repeat((configCodificacion?.digitos_correlativo || 3) - 1)}1]
                </div>
              </div>

              <p style={{ margin: '14px 0 0 0' }}>
                <strong>Ejemplo práctico:</strong> Si creas la categoría "Facultad de Ingeniería" (Abreviación: <code>ING</code>) dentro de "Contratos" (Código Padre: <code>CON</code>), el código resultante será:
              </p>

              <div style={{ background: '#121624', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', border: '1px solid rgba(255,255,255,0.04)', color: '#22c55e', marginTop: '8px', fontWeight: 600, textAlign: 'center' }}>
                {configCodificacion?.prefijo_global ? configCodificacion.prefijo_global : ''}
                {configCodificacion?.usar_abreviacion_padre ? `CON${configCodificacion.separador || ''}` : ''}
                ING
                {configCodificacion?.separador || ''}
                {'0'.repeat((configCodificacion?.digitos_correlativo || 3) - 1)}1
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderConfiguracionSistemaView = () => {
    return (
      <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', height: '100%', boxSizing: 'border-box', fontFamily: 'Outfit, sans-serif' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#fff' }}>Preferencias y Configuración del Sistema</h2>
          <span style={{ fontSize: '13px', color: '#8f9cae' }}>Ajusta la paleta cromática de la organización (Branding), fuentes de lectura, copias de seguridad y reseteo del sistema.</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
          {/* Panel Formulario Apariencia */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '20px', background: '#090d16' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: 'var(--primary-glow)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              🎨 Apariencia y Marca (Whitelabel)
            </h3>

            {/* Tema de Colores con Puntitos Interactivos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#8f9cae', fontWeight: 500 }}>Paleta Cromática (Identidad Visual):</span>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                {[
                  { id: 'cyberpunk', name: 'Cyberpunk Violet', primary: '#a855f7', secondary: '#6366f1' },
                  { id: 'ocean', name: 'Ocean Cyan', primary: '#06b6d4', secondary: '#3b82f6' },
                  { id: 'emerald', name: 'Emerald Matrix', primary: '#10b981', secondary: '#14b8a6' },
                  { id: 'amber', name: 'Amber Fire', primary: '#f59e0b', secondary: '#ef4444' }
                ].map(paleta => (
                  <button
                    key={paleta.id}
                    onClick={() => setPrefTemaColor(paleta.id)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${paleta.primary} 0%, ${paleta.secondary} 100%)`,
                      border: prefTemaColor === paleta.id ? '2px solid #fff' : '2px solid transparent',
                      boxShadow: prefTemaColor === paleta.id 
                        ? `0 0 14px ${paleta.primary}` 
                        : '0 4px 8px rgba(0,0,0,0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative'
                    }}
                    title={paleta.name}
                  >
                    {prefTemaColor === paleta.id && (
                      <span style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#fff'
                      }} />
                    )}
                  </button>
                ))}
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#fff', marginLeft: '6px' }}>
                  {prefTemaColor === 'cyberpunk' && 'Cyberpunk Violet (Por Defecto)'}
                  {prefTemaColor === 'ocean' && 'Ocean Cyan (Corporativo)'}
                  {prefTemaColor === 'emerald' && 'Emerald Matrix (Legal/Auditoría)'}
                  {prefTemaColor === 'amber' && 'Amber Fire (Industrial/Operaciones)'}
                </span>
              </div>
            </div>



            {/* Tipografía */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#8f9cae', fontWeight: 500 }}>Tipografía del Sistema:</span>
              <select 
                value={prefTipoFuente}
                onChange={(e) => setPrefTipoFuente(e.target.value)}
                style={{ background: '#121624', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', fontFamily: 'Outfit', outline: 'none', cursor: 'pointer' }}
              >
                <option value="Outfit">Outfit (Moderna & Redonda - Premium)</option>
                <option value="Inter">Inter (Muy clara - Estándar ISO/Audit)</option>
                <option value="Fira Code">Fira Code (Monospaced - Técnico/Ingeniería)</option>
              </select>
            </div>

            {/* Switch de Sombras / Glow */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>Efectos de Brillo Neón (Glow)</span>
                <span style={{ fontSize: '11px', color: '#8f9cae' }}>Desactívalo en computadoras lentas de depósitos físicos para maximizar FPS.</span>
              </div>
              <input 
                type="checkbox" 
                checked={prefEfectosGlow}
                onChange={(e) => setPrefEfectosGlow(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-glow)' }}
              />
            </div>

            {/* Switch de Sonidos */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>Sonido Beep del Escáner QR</span>
                <span style={{ fontSize: '11px', color: '#8f9cae' }}>Sonido acústico de confirmación al indexar o escanear archivos.</span>
              </div>
              <input 
                type="checkbox" 
                checked={prefSonidoQR}
                onChange={(e) => setPrefSonidoQR(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-glow)' }}
              />
            </div>
          </div>

          {/* Panel Previsualización / Whitelabel */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.01)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 600 }}>👁️ Previsualización de Marca</h3>
            <span style={{ fontSize: '12px', color: '#8f9cae' }}>Así lucirán las ventanas de alertas, botones primarios e identificadores en tu tema actual:</span>

            {/* Caja de previsualización */}
            <div style={{ background: '#0a0d17', border: '1.5px solid var(--primary-glow)', boxShadow: '0 0 15px var(--glow-shadow-intensity)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'all 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Estante Físico de Pruebas</span>
                <span style={{ background: 'var(--primary-glow-bg)', border: '1px solid var(--primary-glow)', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '50px' }}>EST-PREV</span>
              </div>
              <span style={{ fontSize: '11px', color: '#8f9cae' }}>Código QR asociado y verificado con éxito en el servidor de base de datos.</span>
              <button className="btn-primary" style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '12px', width: 'fit-content', border: 'none', cursor: 'pointer' }}>
                Botón de Acción Primaria
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Ejemplo de Fuente:</span>
              <span style={{ fontSize: '13px', color: '#fff', fontFamily: 'var(--font-family-system)', fontStyle: 'italic' }}>
                "El DMS híbrido Archi-vite asegura la consistencia física y lógica mediante adyacencia recursiva."
              </span>
            </div>
          </div>
        </div>

        {/* Panel de Copias de Seguridad (Backups) */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '20px', background: '#090d16', marginTop: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--primary-glow)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            💾 Gestión de Copias de Seguridad (Backups)
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', lineHeight: '1.6' }}>
            Respalda toda la estructura lógica/física del DMS, catálogo de personas, logs e información de retenciones.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '220px' }}>
              <span style={{ fontSize: '11px', color: '#8f9cae', fontWeight: 600 }}>Tipo de Copia de Seguridad:</span>
              <select
                value={backupTipo}
                onChange={(e) => setBackupTipo(e.target.value)}
                style={{ background: '#121624', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', fontFamily: 'Outfit', outline: 'none', cursor: 'pointer' }}
              >
                <option value="total">Copia Total (BD + PDFs en ZIP)</option>
                <option value="metadatos">Metadatos (Solo BD en JSON)</option>
              </select>
            </div>
            <button
              onClick={handleCrearBackup}
              disabled={isCreatingBackup}
              className="btn-primary"
              style={{
                padding: '12px 24px',
                fontSize: '13px',
                fontWeight: 700,
                borderRadius: '8px',
                border: 'none',
                cursor: isCreatingBackup ? 'not-allowed' : 'pointer',
                marginTop: '15px'
              }}
            >
              {isCreatingBackup ? 'Generando Copia...' : 'Generar Copia de Seguridad'}
            </button>
          </div>

          {/* Tabla de Backups Disponibles */}
          <div>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#fff', fontWeight: 600 }}>Copias de Seguridad Disponibles en el Servidor</h4>
            {backups.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.08)', color: '#64748b', fontSize: '13px' }}>
                No se han generado copias de seguridad aún.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                {backups.map((b) => (
                  <div key={b.filename} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '13px', color: '#fff', fontFamily: 'monospace', fontWeight: 600 }}>{b.filename}</span>
                      <span style={{ fontSize: '11px', color: '#8f9cae' }}>
                        Tipo: <strong style={{ color: b.tipo === 'total' ? '#c084fc' : '#38bdf8' }}>{b.tipo.toUpperCase()}</strong> · Tamaño: {(b.size / 1024 / 1024).toFixed(2)} MB · Creado el: {new Date(b.fecha).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href={`${API_BASE_URL}/sistema/backup/descargar/${b.filename}`}
                        download
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                      >
                        Descargar
                      </a>
                      <button
                        onClick={() => handleEliminarBackup(b.filename)}
                        style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer', fontWeight: 600 }}
                        className="hover-scale"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel de Gestión del Despliegue del Árbol (Persistencia) */}
        {(() => {
          let guardados = [];
          try {
            guardados = JSON.parse(localStorage.getItem(`pref_arbol_expandidos_guardados_${tipoJerarquia}`) || '[]');
          } catch(e) {}

          return (
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '20px', background: '#090d16', marginTop: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--primary-glow)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                🌳 Estructura de Despliegue del Árbol Jerárquico
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', lineHeight: '1.6' }}>
                Administra las ramas y subcategorías que se mantendrán expandidas automáticamente cada vez que ingreses al módulo DMS.
              </p>

              {guardados.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.08)', color: '#64748b', fontSize: '13px' }}>
                  No tienes ninguna rama guardada. Por defecto, solo se expandirán las ramas principales.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#8f9cae', fontWeight: 600 }}>Ramas Auto-Expandibles Guardadas ({guardados.length}):</span>
                    <button
                      onClick={() => {
                        localStorage.removeItem(`pref_arbol_expandidos_guardados_${tipoJerarquia}`);
                        localStorage.removeItem(`pref_arbol_expandidos_${tipoJerarquia}`);
                        triggerNotification("Despliegue Reestablecido", "Se limpiaron todos los nodos guardados.");
                        fetchTreeData();
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#f87171',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      className="hover-scale"
                    >
                      Limpiar Todo
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                    {guardados.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          borderRadius: '6px',
                          padding: '8px 10px'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', marginRight: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.nombre}>
                            {item.nombre}
                          </span>
                          <span style={{ fontSize: '9px', color: item.tipo === 'Física' ? '#22c55e' : '#a855f7', fontWeight: 700 }}>
                            {item.tipo.toUpperCase()}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            const filtrado = guardados.filter(x => x.id !== item.id);
                            localStorage.setItem(`pref_arbol_expandidos_guardados_${tipoJerarquia}`, JSON.stringify(filtrado));
                            const ids = filtrado.map(x => x.id);
                            localStorage.setItem(`pref_arbol_expandidos_${tipoJerarquia}`, JSON.stringify(ids));
                            triggerNotification("Elemento Removido", `Se removió '${item.nombre}' de la vista guardada.`);
                            fetchTreeData();
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#8f9cae',
                            fontSize: '14px',
                            padding: '2px 6px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          className="hover-scale"
                          title="Eliminar del despliegue automático"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Zona de Peligro: Restablecer Sistema de forma completa */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.02)', display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠️ Zona de Peligro: Restablecer Todo el Sistema
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', lineHeight: '1.6' }}>
            Esta acción eliminará de forma permanente **todos** los nodos jerárquicos (lógicos y físicos), documentos cargados en el DMS, catálogo de roles de la organización, directorio de personas con sus firmas vinculadas, transiciones y estados de la FSM, y registros del log de auditoría. El usuario administrador global <strong>'admin'</strong> no será eliminado.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '280px' }}>
              <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 600 }}>Escribe "INICIALIZAR-SISTEMA" para confirmar:</span>
              <input 
                type="text" 
                placeholder="INICIALIZAR-SISTEMA"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                style={{ background: '#120d16', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', fontFamily: 'monospace', outline: 'none' }}
              />
            </div>
            <button
              onClick={() => setShowResetConfirmModal(true)}
              disabled={resetConfirmText !== 'INICIALIZAR-SISTEMA' || isResetting}
              style={{
                background: resetConfirmText === 'INICIALIZAR-SISTEMA' ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' : '#27171c',
                border: 'none',
                color: resetConfirmText === 'INICIALIZAR-SISTEMA' ? '#fff' : '#6b7280',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: resetConfirmText === 'INICIALIZAR-SISTEMA' ? 'pointer' : 'not-allowed',
                boxShadow: resetConfirmText === 'INICIALIZAR-SISTEMA' ? '0 0 15px rgba(239, 68, 68, 0.45)' : 'none',
                transition: 'all 0.25s ease',
                marginTop: '15px'
              }}
              className={resetConfirmText === 'INICIALIZAR-SISTEMA' ? 'hover-scale' : ''}
            >
              {isResetting ? 'Restableciendo...' : 'Restablecer y Vaciar Todo'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAlertasRetencionView = () => {
    return (
      <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', height: '100%', boxSizing: 'border-box', fontFamily: 'Outfit, sans-serif' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#fff' }}>Alertas de Retención y Transferencias Físicas</h2>
          <span style={{ fontSize: '13px', color: '#8f9cae' }}>Gestiona los expedientes físicos cuyo plazo de retención en cajas locales ha expirado y requieren transferencia.</span>
        </div>

        <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '16px', background: '#090d16' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            🚨 Archivos Físicos Expirados
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', lineHeight: '1.6' }}>
            Los siguientes documentos han superado el límite de meses configurado para su permanencia en su caja/estante actual. Deben ser trasladados al almacén o ubicación de destino establecida.
          </p>

          {alertasRetencion.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.08)', color: '#64748b', fontSize: '13px' }}>
              🎉 ¡No hay alertas de retención activas! Todos los archivos físicos se encuentran dentro de su período de retención válido.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alertasRetencion.map((alerta) => {
                const limite = alerta.fecha_limite_retencion ? new Date(alerta.fecha_limite_retencion).toLocaleDateString() : 'N/A';
                let diasVencidos = 0;
                if (alerta.fecha_limite_retencion) {
                  const diff = Date.now() - new Date(alerta.fecha_limite_retencion).getTime();
                  diasVencidos = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
                }

                // Destino dinámico basado en la estructura
                const destinoObj = alerta.ubicacion_fisica?.nodo_destino_transferencia_id 
                  ? getDestinosElegibles(treeData, true).find(d => d.id === alerta.ubicacion_fisica.nodo_destino_transferencia_id)
                  : null;

                return (
                  <div key={alerta.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', border: '1.5px solid rgba(239, 68, 68, 0.25)', boxShadow: '0 0 10px rgba(239, 68, 68, 0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <AlertTriangle size={16} color="#ef4444" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{alerta.nombre_archivo}</span>
                          <span style={{ fontSize: '11px', color: '#8f9cae' }}>ID DMS: {alerta.identificador_dms} · Versión: {alerta.version}</span>
                        </div>
                      </div>
                      <span style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '50px' }}>
                        VENCIDO HACE {diasVencidos} DÍAS
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ fontSize: '10px', color: '#8f9cae', fontWeight: 600, textTransform: 'uppercase' }}>📍 Ubicación de Origen (Expirada)</span>
                        <span style={{ fontSize: '12px', color: '#fff', fontWeight: 500 }}>{alerta.ubicacion_fisica?.nombre || 'Desconocida'}</span>
                        <span style={{ fontSize: '10px', color: '#22c55e', fontFamily: 'monospace' }}>{alerta.ubicacion_fisica?.codigo_inteligente}</span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ fontSize: '10px', color: '#8f9cae', fontWeight: 600, textTransform: 'uppercase' }}>🏢 Destino de Transferencia</span>
                        <span style={{ fontSize: '12px', color: '#fff', fontWeight: 500 }}>
                          {destinoObj ? destinoObj.nombre : 'Archivo Central Corporativo'}
                        </span>
                        <span style={{ fontSize: '10px', color: '#c084fc', fontFamily: 'monospace' }}>
                          {destinoObj ? destinoObj.codigo : 'AVACC-001'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ fontSize: '10px', color: '#8f9cae', fontWeight: 600, textTransform: 'uppercase' }}>📅 Fecha Límite de Retención</span>
                        <span style={{ fontSize: '12px', color: '#fff', fontWeight: 500 }}>{limite}</span>
                        <span style={{ fontSize: '10px', color: '#cbd5e1' }}>Regla: {alerta.ubicacion_fisica?.meses_retencion_limite || 12} meses límite</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                      <button 
                        onClick={() => {
                          setPreviewFileName(alerta.nombre_archivo);
                          setPreviewFileUrl(`${API_BASE_URL}${alerta.ruta_archivo}`);
                          const ext = alerta.nombre_archivo.split('.').pop().toLowerCase();
                          if (ext === 'pdf') setPreviewFileType('pdf');
                          else if (['png','jpg','jpeg','gif'].includes(ext)) setPreviewFileType('image');
                          else setPreviewFileType('generic');
                          setShowPreviewModal(true);
                        }}
                        className="glass-card"
                        style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 600, color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        👁️ Ver Archivo
                      </button>
                      <button 
                        onClick={() => handleTransferirDocumentoFisico(alerta.id)}
                        className="btn-primary"
                        style={{ 
                          padding: '8px 18px', 
                          fontSize: '12px', 
                          fontWeight: 700, 
                          color: '#fff', 
                          borderRadius: '6px', 
                          cursor: 'pointer',
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          border: 'none',
                          boxShadow: '0 0 10px rgba(239, 68, 68, 0.3)'
                        }}
                      >
                        🔄 Transferir Físicamente
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!token) {
    return (
      <div style={{ 
        display: 'flex', 
        width: '100vw', 
        height: '100vh', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'linear-gradient(135deg, rgba(8, 10, 15, 0.88) 0%, rgba(9, 9, 11, 0.95) 100%), url(/login_bg.png) no-repeat center center / cover',
        fontFamily: 'Outfit, sans-serif',
        position: 'relative'
      }}>
        {showChangePasswordPanel ? (
          <form onSubmit={handleChangePasswordSubmit} className="glass-panel" style={{ width: '380px', padding: '40px', borderRadius: '16px', border: '1px solid rgba(168, 85, 247, 0.25)', boxShadow: '0 0 30px rgba(168, 85, 247, 0.15)', display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(168, 85, 247, 0.1)', width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(168,85,247,0.2)', boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)' }}>
                <Key size={28} color="#c084fc" />
              </div>
              <h2 style={{ margin: '6px 0 0 0', fontSize: '22px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', textAlign: 'center' }}>Primer Ingreso</h2>
              <span style={{ fontSize: '12px', color: '#a855f7', fontWeight: 600 }}>Cambio de Contraseña Obligatorio</span>
            </div>

            <p style={{ margin: 0, fontSize: '12px', color: '#8f9cae', lineHeight: 1.5, textAlign: 'center' }}>
              Por motivos de seguridad y política del sistema <strong>Archi-vite</strong>, debe actualizar su contraseña inicial (identificación) antes de acceder al DMS.
            </p>

            {changePasswordError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '10px 14px', color: '#f87171', fontSize: '12px', textAlign: 'center' }}>
                ⚠️ {changePasswordError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: '#8f9cae', fontWeight: 500 }}>Nueva Contraseña</label>
              <input 
                type="password" 
                required
                placeholder="Mínimo 4 caracteres"
                value={newPasswordVal}
                onChange={(e) => setNewPasswordVal(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Outfit' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: '#8f9cae', fontWeight: 500 }}>Confirmar Contraseña</label>
              <input 
                type="password" 
                required
                placeholder="Repita la nueva contraseña"
                value={confirmPasswordVal}
                onChange={(e) => setConfirmPasswordVal(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Outfit' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button 
                type="button" 
                onClick={() => {
                  setShowChangePasswordPanel(false);
                  setTempTokenData(null);
                  setNewPasswordVal('');
                  setConfirmPasswordVal('');
                  setChangePasswordError('');
                }}
                className="glass-card"
                style={{ flex: 1, padding: '14px', color: '#fff', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                style={{ flex: 1, padding: '14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Actualizar
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="glass-panel" style={{ width: '380px', padding: '40px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <img 
                src="/logo.png" 
                style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '12px', 
                  objectFit: 'cover', 
                  boxShadow: '0 0 15px var(--primary-glow)',
                  border: '1px solid rgba(255,255,255,0.1)' 
                }} 
                alt="Archi-vite Logo" 
              />
              <h2 style={{ margin: '6px 0 0 0', fontSize: '24px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Archi-vite</h2>
              <span style={{ fontSize: '12px', color: '#8f9cae' }}>Consolidador de Jerarquías de Archivos</span>
            </div>

            {loginError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '10px 14px', color: '#f87171', fontSize: '12px', textAlign: 'center' }}>
                ⚠️ {loginError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: '#8f9cae', fontWeight: 500 }}>Usuario</label>
              <input 
                type="text" 
                required
                placeholder="admin o lector"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Outfit' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: '#8f9cae', fontWeight: 500 }}>Contraseña</label>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Outfit' }}
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary"
              style={{ padding: '14px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginTop: '10px' }}
            >
              Iniciar Sesión
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      
      {/* Spinner de Carga General */}
      {isLoading && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(9,9,11,0.7)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', zIndex: 9999 }}>
          <Activity size={40} className="pulse-glow" color="#a855f7" />
          <span style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>Conectando y sincronizando con el servidor DMS...</span>
        </div>
      )}

      {/* Botón Flotante de Colapso Sidebar Izquierdo */}
      <button 
        onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
        style={{
          position: 'absolute',
          left: isLeftCollapsed ? '16px' : '314px',
          top: '24px',
          zIndex: 100,
          background: 'rgba(26, 21, 44, 0.9)',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: '8px',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}
        title={isLeftCollapsed ? "Expandir menú izquierdo" : "Colapsar menú izquierdo"}
      >
        {isLeftCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Botón Flotante de Colapso Sidebar Derecho */}
      <button 
        onClick={() => setIsRightCollapsed(!isRightCollapsed)}
        style={{
          position: 'absolute',
          right: isRightCollapsed ? '16px' : '384px',
          top: '24px',
          zIndex: 100,
          background: 'rgba(26, 21, 44, 0.9)',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: '8px',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}
        title={isRightCollapsed ? "Expandir detalles" : "Colapsar detalles"}
      >
        {isRightCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* 1. Panel Lateral Izquierdo */}
      <aside 
        className="glass-panel" 
        style={{ 
          width: isLeftCollapsed ? '0px' : '330px', 
          opacity: isLeftCollapsed ? 0 : 1,
          pointerEvents: isLeftCollapsed ? 'none' : 'auto',
          display: 'flex', 
          flexDirection: 'column', 
          borderRight: isLeftCollapsed ? 'none' : '1px solid rgba(255,255,255,0.06)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden'
        }}
      >
        {/* Header Logo */}
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <img 
            src="/logo.png" 
            style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '12px', 
              objectFit: 'cover', 
              boxShadow: '0 0 10px var(--primary-glow)',
              border: '1px solid rgba(255,255,255,0.1)' 
            }} 
            alt="Logo" 
          />
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, background: 'linear-gradient(to right, #ffffff, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>Archi-vite</h1>
            <span style={{ fontSize: '11px', color: '#8f9cae', fontWeight: 500 }}>Gestor de Archivos DMS</span>
          </div>
        </div>

        {/* Buscador Universal Unificado */}
        <div style={{ padding: '20px 20px 10px 20px', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px 14px', gap: '10px' }}>
            <Search size={16} color="#8f9cae" />
            <input 
              type="text" 
              placeholder="Buscar categoría o archivo DMS..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: '13px', width: '100%', fontFamily: 'Outfit' }}
            />
            <button 
              onClick={() => setShowFiltrosPanel(!showFiltrosPanel)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: showFiltrosPanel ? '#c084fc' : '#8f9cae', transition: 'color 0.2s' }}
              title="Filtros Avanzados"
            >
              <Sliders size={16} />
            </button>
          </div>

          {/* Panel de Filtros Avanzados en vivo */}
          {showFiltrosPanel && (
            <div className="glass-panel" style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '12px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#c084fc', fontWeight: 600 }}>⚙️ Filtros de Búsqueda</span>
                {(filterEstado || filterTipo !== 'todos' || filterPersona) && (
                  <button 
                    onClick={() => {
                      setFilterEstado('');
                      setFilterTipo('todos');
                      setFilterPersona('');
                    }}
                    style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Filtro por Tipo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontSize: '10px', color: '#8f9cae' }}>Tipo de Elemento:</span>
                <select 
                  value={filterTipo} 
                  onChange={(e) => setFilterTipo(e.target.value)}
                  style={{ background: '#121624', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', color: '#fff', padding: '6px 8px', fontSize: '11px', outline: 'none', cursor: 'pointer', fontFamily: 'Outfit' }}
                >
                  <option value="todos">Todos (Estructura Completa)</option>
                  <option value="archivo">Solo Archivos DMS</option>
                  <option value="categoria">Solo Categorías / Ubicaciones</option>
                </select>
              </div>

              {/* Filtro por Estado (Fase Workflow) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontSize: '10px', color: '#8f9cae' }}>Fase de Workflow:</span>
                <select 
                  value={filterEstado} 
                  onChange={(e) => setFilterEstado(e.target.value)}
                  style={{ background: '#121624', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', color: '#fff', padding: '6px 8px', fontSize: '11px', outline: 'none', cursor: 'pointer', fontFamily: 'Outfit' }}
                >
                  <option value="">Todas las fases</option>
                  {estados.map(est => (
                    <option key={`filter-state-${est.id}`} value={est.nombre}>{est.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por Persona Vinculada */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontSize: '10px', color: '#8f9cae' }}>Miembro Vinculado:</span>
                <select 
                  value={filterPersona} 
                  onChange={(e) => setFilterPersona(e.target.value)}
                  style={{ background: '#121624', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', color: '#fff', padding: '6px 8px', fontSize: '11px', outline: 'none', cursor: 'pointer', fontFamily: 'Outfit' }}
                >
                  <option value="">Todos los miembros</option>
                  {personas.map(p => (
                    <option key={`filter-persona-${p.id}`} value={p.id}>{p.nombre_completo} ({p.identificacion})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="glass-panel" style={{ position: 'absolute', top: '70px', left: '20px', right: '20px', borderRadius: '10px', overflow: 'hidden', zIndex: 50, border: '1px solid rgba(255,255,255,0.1)' }}>
              {searchResults.map((res, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handleSelectSearchResult(res)}
                  style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '2px' }}
                  className="hover-scale"
                >
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>{res.nombre}</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#8f9cae', fontFamily: 'monospace' }}>{res.codigo}</span>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: res.es_archivo ? '#ef4444' : '#a855f7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {res.tipo}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Menú de Vistas (Ecosistema Completo) */}
        <div style={{ padding: '10px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '9px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', paddingLeft: '8px' }}>Menú Navegación</span>
          
          <div 
            onClick={() => setActiveMenu('dashboard')} 
            className="hover-scale" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '10px 14px', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              color: activeMenu === 'dashboard' ? '#fff' : '#cbd5e1', 
              background: activeMenu === 'dashboard' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.01)', 
              border: activeMenu === 'dashboard' ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255,255,255,0.03)' 
            }}
          >
            <PieChart size={15} color={activeMenu === 'dashboard' ? '#c084fc' : '#8f9cae'} />
            <span style={{ fontSize: '13px', fontWeight: activeMenu === 'dashboard' ? 600 : 500 }}>Dashboard Global</span>
          </div>

          <div 
            onClick={() => {
              setActiveMenu('jerarquias');
              setActiveView('grafico');
            }} 
            className="hover-scale" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '10px 14px', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              color: activeMenu === 'jerarquias' ? '#fff' : '#cbd5e1', 
              background: activeMenu === 'jerarquias' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.01)', 
              border: activeMenu === 'jerarquias' ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255,255,255,0.03)' 
            }}
          >
            <Folder size={15} color={activeMenu === 'jerarquias' ? '#c084fc' : '#8f9cae'} />
            <span style={{ fontSize: '13px', fontWeight: activeMenu === 'jerarquias' ? 600 : 500 }}>Árbol Gráfico</span>
          </div>

          <div 
            onClick={() => {
              setActiveMenu('consola_tree');
              setActiveView('linux');
            }} 
            className="hover-scale" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '10px 14px', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              color: activeMenu === 'consola_tree' ? '#fff' : '#cbd5e1', 
              background: activeMenu === 'consola_tree' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.01)', 
              border: activeMenu === 'consola_tree' ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255,255,255,0.03)',
              marginTop: '4px'
            }}
          >
            <FileCode size={15} color={activeMenu === 'consola_tree' ? '#c084fc' : '#8f9cae'} />
            <span style={{ fontSize: '13px', fontWeight: activeMenu === 'consola_tree' ? 600 : 500 }}>Explorador de Consola</span>
          </div>

          <div 
            onClick={() => setActiveMenu('workflow')} 
            className="hover-scale" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '10px 14px', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              color: activeMenu === 'workflow' ? '#fff' : '#cbd5e1', 
              background: activeMenu === 'workflow' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.01)', 
              border: activeMenu === 'workflow' ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255,255,255,0.03)' 
            }}
          >
            <Sliders size={15} color={activeMenu === 'workflow' ? '#c084fc' : '#8f9cae'} />
            <span style={{ fontSize: '13px', fontWeight: activeMenu === 'workflow' ? 600 : 500 }}>Flujo de Trabajo</span>
          </div>

          <div 
            onClick={() => setActiveMenu('alertas')} 
            className="hover-scale" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '10px 14px', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              color: activeMenu === 'alertas' ? '#fff' : '#cbd5e1', 
              background: activeMenu === 'alertas' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.01)', 
              border: activeMenu === 'alertas' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.03)',
              marginTop: '4px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle size={15} color={activeMenu === 'alertas' ? '#ef4444' : '#8f9cae'} />
              <span style={{ fontSize: '13px', fontWeight: activeMenu === 'alertas' ? 600 : 500 }}>Alertas de Retención</span>
            </div>
            {alertasRetencion.length > 0 && (
              <span style={{ 
                background: '#ef4444', 
                color: '#fff', 
                fontSize: '9px', 
                fontWeight: 700, 
                padding: '2px 6px', 
                borderRadius: '50px',
                boxShadow: '0 0 8px #ef4444aa'
              }}>
                {alertasRetencion.length}
              </span>
            )}
          </div>

          <div 
            onClick={() => setActiveMenu('reportes')} 
            className="hover-scale" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '10px 14px', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              color: activeMenu === 'reportes' ? '#fff' : '#cbd5e1', 
              background: activeMenu === 'reportes' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.01)', 
              border: activeMenu === 'reportes' ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255,255,255,0.03)',
              marginTop: '4px'
            }}
          >
            <FileSpreadsheet size={15} color={activeMenu === 'reportes' ? '#c084fc' : '#8f9cae'} />
            <span style={{ fontSize: '13px', fontWeight: activeMenu === 'reportes' ? 600 : 500 }}>Centro de Reportes</span>
          </div>

          {userRol === 'admin' && (
            <>
              <div 
                onClick={() => setActiveMenu('usuarios')} 
                className="hover-scale" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '10px 14px', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  color: activeMenu === 'usuarios' ? '#fff' : '#cbd5e1', 
                  background: activeMenu === 'usuarios' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.01)', 
                  border: activeMenu === 'usuarios' ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255,255,255,0.03)' 
                }}
              >
                <Users size={15} color={activeMenu === 'usuarios' ? '#c084fc' : '#8f9cae'} />
                <span style={{ fontSize: '13px', fontWeight: activeMenu === 'usuarios' ? 600 : 500 }}>Usuarios & Roles</span>
              </div>

              <div 
                onClick={() => setActiveMenu('auditoria')} 
                className="hover-scale" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '10px 14px', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  color: activeMenu === 'auditoria' ? '#fff' : '#cbd5e1', 
                  background: activeMenu === 'auditoria' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.01)', 
                  border: activeMenu === 'auditoria' ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255,255,255,0.03)' 
                }}
              >
                <Clock size={15} color={activeMenu === 'auditoria' ? '#c084fc' : '#8f9cae'} />
                <span style={{ fontSize: '13px', fontWeight: activeMenu === 'auditoria' ? 600 : 500 }}>Registro Auditoría</span>
              </div>

              <div 
                onClick={() => setActiveMenu('codificacion')} 
                className="hover-scale" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '10px 14px', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  color: activeMenu === 'codificacion' ? '#fff' : '#cbd5e1', 
                  background: activeMenu === 'codificacion' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.01)', 
                  border: activeMenu === 'codificacion' ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255,255,255,0.03)',
                  marginTop: '4px'
                }}
              >
                <Cpu size={15} color={activeMenu === 'codificacion' ? '#c084fc' : '#8f9cae'} />
                <span style={{ fontSize: '13px', fontWeight: activeMenu === 'codificacion' ? 600 : 500 }}>Config. Codificación</span>
              </div>

              <div 
                onClick={() => setActiveMenu('configuracion')} 
                className="hover-scale"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '10px 14px', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  color: activeMenu === 'configuracion' ? '#fff' : '#cbd5e1', 
                  background: activeMenu === 'configuracion' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.01)', 
                  border: activeMenu === 'configuracion' ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255,255,255,0.03)',
                  marginTop: '4px'
                }}
              >
                <Settings size={15} color={activeMenu === 'configuracion' ? '#c084fc' : '#8f9cae'} />
                <span style={{ fontSize: '13px', fontWeight: activeMenu === 'configuracion' ? 600 : 500 }}>Preferencias</span>
              </div>
            </>
          )}
        </div>

        {/* Nav de Estructura DMS Compacta */}
        <div style={{ flex: 1, padding: '10px 20px 20px 20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: '8px' }}>
          <span style={{ fontSize: '9px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '8px' }}>Estructura DMS Compacta</span>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingRight: '4px' }}>
            {treeData && Object.keys(treeData).length > 0 ? (
              renderCompactTree(treeData)
            ) : (
              <span style={{ fontSize: '11px', color: '#475569' }}>Cargando estructura...</span>
            )}
          </div>
        </div>

        {/* Footer Perfil */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.1)' }}>
          <div style={{ background: 'rgba(168,85,247,0.1)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={18} color="#c084fc" />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#fff' }}>{username}</h4>
            <span style={{ fontSize: '10px', color: '#8f9cae', textTransform: 'capitalize' }}>{userRol === 'admin' ? 'Admin' : 'Lector'}</span>
          </div>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }} title="Cerrar Sesión">
            <LogOut size={16} color="#ef4444" />
          </button>
        </div>
      </aside>

      {/* 2. Área Central */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', background: '#09090b', overflow: 'hidden' }}>
        
        {/* Renderizado Dinámico de Vistas en el Canvas Central */}
        
        {/* A. Vista Jerarquías & Explorador de Consola */}
        {(activeMenu === 'jerarquias' || activeMenu === 'consola_tree') && (() => {
          const currentView = activeMenu === 'jerarquias' ? 'grafico' : 'linux';
          return (
            <>
              <header style={{ height: '80px', padding: '0 30px 0 60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,14,23,0.3)', backdropFilter: 'blur(12px)' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#fff' }}>
                    {activeMenu === 'jerarquias' ? 'Árbol Gráfico Jerárquico' : 'Explorador de Consola (DMS)'}
                  </h2>
                  <p style={{ margin: 0, fontSize: '12px', color: '#8f9cae' }}>
                    {activeMenu === 'jerarquias' ? 'Visualiza y despliega la estructura organizacional del DMS en formato gráfico.' : 'Navegación e interacción directa sobre la jerarquía del DMS.'}
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '3px' }}>
                    <button 
                      onClick={() => {
                        setTipoJerarquia('logico');
                        setSelectedVistaId('');
                        fetchTreeData('logico');
                      }}
                      style={{
                        background: tipoJerarquia === 'logico' ? 'rgba(168, 85, 247, 0.2)' : 'none',
                        border: 'none',
                        color: tipoJerarquia === 'logico' ? '#c084fc' : '#8f9cae',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      📂 Estructura Lógica
                    </button>
                    <button 
                      onClick={() => {
                        setTipoJerarquia('fisico');
                        setSelectedVistaId('');
                        fetchTreeData('fisico');
                      }}
                      style={{
                        background: tipoJerarquia === 'fisico' ? 'rgba(34, 197, 94, 0.2)' : 'none',
                        border: 'none',
                        color: tipoJerarquia === 'fisico' ? '#22c55e' : '#8f9cae',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      📍 Estructura Física
                    </button>
                  </div>

                  {/* Selector y Guardado de Vistas */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '8px' }}>
                    <select
                      value={selectedVistaId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedVistaId(val);
                        if (val) handleApplyVista(val);
                      }}
                      style={{
                        background: '#121624',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        color: '#fff',
                        padding: '6px 10px',
                        fontSize: '12px',
                        fontFamily: 'Outfit',
                        outline: 'none',
                        cursor: 'pointer',
                        minWidth: '120px'
                      }}
                    >
                      <option value="">-- Vistas Guardadas --</option>
                      {vistasGuardadas.filter(v => v.tipo_arbol === tipoJerarquia).map(v => (
                        <option key={`vista-sel-${v.id}`} value={v.id}>{v.nombre}</option>
                      ))}
                    </select>

                    {selectedVistaId && (
                      <button
                        onClick={async () => {
                          const vista = vistasGuardadas.find(v => v.id === parseInt(selectedVistaId));
                          if (!vista) return;
                          
                          const expandidos = obtenerNodosExpandidosActuales();
                          
                          try {
                            setIsLoading(true);
                            const res = await fetch(`${API_BASE_URL}/vistas/`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({
                                nombre: vista.nombre,
                                tipo_arbol: tipoJerarquia,
                                nodos_expandidos: expandidos
                              })
                            });
                            if (res.ok) {
                              triggerNotification("Vista Actualizada", `Se guardaron los cambios en "${vista.nombre}".`);
                              await fetchVistasGuardadas();
                            }
                          } catch(err) {
                            console.error(err);
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                          border: 'none',
                          color: '#fff',
                          boxShadow: '0 0 10px rgba(6, 182, 212, 0.25)',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        title="Guardar cambios de expansión en la vista seleccionada"
                      >
                        💾 Guardar Vista
                      </button>
                    )}

                    <button
                      onClick={() => setShowSaveVistaModal(true)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        color: '#c084fc',
                        transition: 'all 0.2s'
                      }}
                      title="Crear una nueva vista con el despliegue actual de carpetas"
                    >
                      ✨ Crear Nueva Vista
                    </button>

                    {selectedVistaId && (
                      <button
                        onClick={() => handleDeleteVista(selectedVistaId)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '6px',
                          color: '#f87171',
                          padding: '6px 10px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Eliminar vista seleccionada"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  
                  {(userRol === 'admin' || selectedNode?.attributes?.puede_escribir === true) && (
                    <button 
                      onClick={() => {
                        if (!selectedNode) {
                          alert("Selecciona primero un nodo padre en el árbol.");
                          return;
                        }
                        setShowAddModal(true);
                      }}
                      className="btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      <Plus size={16} /> Nueva Subcategoría
                    </button>
                  )}
                </div>
              </header>

              <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
                {(() => {
                  const arbolRender = obtenerArbolFiltrado();
                  return currentView === 'grafico' ? (
                    <div style={{ width: '100%', height: '100%' }} className="rd3t-tree-container">
                      {arbolRender && Object.keys(arbolRender).length > 0 ? (
                        <Tree 
                          key={treeKey} 
                          data={arbolRender} 
                          orientation="horizontal"  
                          pathFunc="diagonal"
                          renderCustomNodeElement={renderCustomNode}
                          translate={{ x: 100, y: 300 }} 
                          nodeSize={{ x: 260, y: 100 }}  
                        />
                      ) : (
                        <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', color: '#64748b' }}>
                          <Activity size={48} className="pulse-glow" />
                          {treeData ? (
                            <span>Ningún elemento coincide con los filtros aplicados.</span>
                          ) : (
                            <span>Conectando con el almacén PostgreSQL...</span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: '100%', overflow: 'auto', padding: '40px', boxSizing: 'border-box', background: '#0b0f19' }}>
                      <div style={{ minWidth: '600px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '16px' }}>
                          <span style={{ fontSize: '13px', fontFamily: 'monospace', color: '#22c55e' }}>root@av-dms-server:~#</span>
                          <span style={{ fontSize: '13px', fontFamily: 'monospace', color: '#fff' }}>tree -a --dirsfirst ./dms_root</span>
                        </div>

                        {arbolRender && Object.keys(arbolRender).length > 0 ? (
                          renderLinuxStyleTree(arbolRender, '', true, true)
                        ) : (
                          <span style={{ color: '#475569', fontSize: '13px', fontFamily: 'monospace' }}>Ningún elemento coincide con los filtros aplicados o no hay jerarquías cargadas.</span>
                        )}
                      
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'monospace', color: '#475569' }}>
                          <span>Ecosistema Archi-vite DMS</span>
                          <span>Ctrl + F para búsqueda rápida en el viewport</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </>
          );
        })()}

        {/* B. Vista Dashboard */}
        {activeMenu === 'dashboard' && renderDashboardView()}

        {/* C. Vista Workflow */}
        {activeMenu === 'workflow' && renderWorkflowView()}

        {/* D. Vista Usuarios */}
        {activeMenu === 'usuarios' && renderUsuariosView()}

        {/* E. Vista Auditoría */}
        {activeMenu === 'auditoria' && renderAuditoriaView()}

        {/* F. Vista Parametrización de Codificación */}
        {activeMenu === 'codificacion' && renderCodificacionView()}

        {/* G. Vista Preferencias y Configuración del Sistema */}
        {activeMenu === 'configuracion' && renderConfiguracionSistemaView()}

        {/* H. Vista Alertas de Retención y Transferencia */}
        {activeMenu === 'alertas' && renderAlertasRetencionView()}

        {/* I. Vista Centro de Reportes Analíticos */}
        {activeMenu === 'reportes' && renderReportesView()}

      </main>

      {/* 3. Panel Derecho (Ficha DMS de Detalles y Workflow Habilitados) */}
      {(activeMenu === 'jerarquias' || activeMenu === 'consola_tree') && (
        <section 
          className="glass-panel" 
        onDragOver={(e) => {
          e.preventDefault();
          if (userRol === 'admin' && selectedNode && activeMenu === 'jerarquias') {
            setIsRightDragOver(true);
          }
        }}
        onDragLeave={() => setIsRightDragOver(false)}
        onDrop={handleRightPanelDrop}
        style={{ 
          width: isRightCollapsed ? '0px' : '400px', 
          opacity: isRightCollapsed ? 0 : 1,
          pointerEvents: isRightCollapsed ? 'none' : 'auto',
          display: 'flex', 
          flexDirection: 'column', 
          borderLeft: isRightCollapsed ? 'none' : '1px solid rgba(255,255,255,0.06)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          background: isRightDragOver 
            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(10, 14, 23, 0.98) 100%)' 
            : 'linear-gradient(135deg, rgba(10, 14, 23, 0.95) 0%, rgba(9, 9, 11, 0.95) 100%)',
          position: 'relative'
        }}
      >
        {isRightDragOver && (
          <div style={{
            position: 'absolute',
            top: '8px',
            bottom: '8px',
            left: '8px',
            right: '8px',
            border: '2px dashed #22c55e',
            borderRadius: '12px',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(34, 197, 94, 0.04)',
            zIndex: 50
          }}>
            <span style={{ color: '#22c55e', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={16} /> Soltar archivos para subir a {selectedNode?.name}
            </span>
          </div>
        )}

        {selectedNode ? (
          selectedNode.attributes?.tipo === 'Sistema' ? (
            <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', color: '#cbd5e1', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
                <div style={{ background: 'rgba(168, 85, 247, 0.1)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyCenter: 'center', alignSelf: 'center', justifyContent: 'center' }}>
                  <Layers size={20} color="#c084fc" />
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#a855f7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estructura Consolidada</span>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>{selectedNode.name}</h3>
                </div>
              </div>
              
              <div className="glass-panel" style={{ padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '13px', lineHeight: 1.6, color: '#fff' }}>
                  Estás visualizando la raíz de consolidación del DMS.
                </p>
                <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.5, color: '#94a3b8' }}>
                  Este nodo es generado virtualmente por el motor del backend para agrupar todas las raíces físicas o lógicas del sistema (como <strong>Contratos de Docentes</strong> y <strong>Convenios Institucionales</strong>). No corresponde a un registro real en la base de datos, por lo que no es posible asociarle archivos directos, vincularle miembros ni eliminarlo.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'rgba(168, 85, 247, 0.03)', border: '1px dashed rgba(168, 85, 247, 0.2)', borderRadius: '8px', fontSize: '11px', color: '#c084fc' }}>
                💡 <strong>Consejo para el usuario:</strong> Despliega el nodo en el árbol interactivo y haz clic en alguna de las subcarpetas o gestiones para habilitar la subida de archivos, asociar firmas, gestionar QR o configurar workflows.
              </div>
            </div>
          ) : (
            <>
              <div style={{ 
                padding: '24px 24px 16px 24px', 
                background: 'rgba(255,255,255,0.01)', 
                borderBottom: '1px solid rgba(255,255,255,0.04)', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px',
                maxHeight: '58vh',
                overflowY: 'auto',
                flexShrink: 0
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detalles de Categoría</span>
                
                {selectedNode.attributes?.estado_nombre ? (
                  <span 
                    style={{ 
                      fontSize: '9px', 
                      border: `1px solid ${selectedNode.attributes.estado_color}`, 
                      color: selectedNode.attributes.estado_color, 
                      padding: '2px 8px', 
                      borderRadius: '6px', 
                      fontWeight: 700,
                      boxShadow: `0 0 8px ${selectedNode.attributes.estado_color}22`
                    }}
                  >
                    {selectedNode.attributes.estado_nombre}
                  </span>
                ) : (
                  <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.03)', color: '#64748b', padding: '2px 8px', borderRadius: '6px' }}>
                    Sin Estado
                  </span>
                )}
              </div>

              <h2 style={{ margin: '0', fontSize: '20px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedNode.name}</h2>
              
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ display: 'flex', flex: 1, justifySelf: 'stretch', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '11px', color: '#8f9cae' }}>Código Único</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#c084fc', fontFamily: 'monospace' }}>{selectedNode.attributes?.codigo}</span>
                </div>
              </div>

              {/* Selector de Estado del Workflow Inteligente y Validado por FSM (Solo Admin) */}
              {userRol === 'admin' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#8f9cae', fontWeight: 500 }}>Fase del Ciclo de Vida:</span>
                  <select 
                    value={estados.find(e => e.nombre === selectedNode.attributes?.estado_nombre)?.id || ''}
                    onChange={(e) => handleChangeNodeEstado(e.target.value)}
                    style={{
                      background: '#121624',
                      border: '1px solid rgba(168, 85, 247, 0.25)',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '8px 10px',
                      fontSize: '12px',
                      fontFamily: 'Outfit',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Si no tiene estado asignado, se puede iniciar con cualquiera */}
                    <option value="">-- Sin Estado Habilitado --</option>
                    
                    {/* Mostrar los estados siguientes válidos por FSM y tipo */}
                    {getValidosEstadosSiguientes(selectedNode.attributes?.estado_nombre, 'categoria').map(est => (
                      <option key={`node-state-${est.id}`} value={est.id}>#{est.secuencia} - {est.nombre}</option>
                    ))}
                    
                    {/* Mantener la opción actual en el select */}
                    {selectedNode.attributes?.estado_nombre && (
                      <option disabled value="">
                        [Fase Actual: {selectedNode.attributes.estado_nombre}]
                      </option>
                    )}
                  </select>
                  <span style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>⚠️ Solo se muestran las siguientes fases válidas según la secuencia de transiciones.</span>
                </div>
              )}

              {/* Sección de Etiquetas / Tags de Búsqueda */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#8f9cae', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>🏷️ Etiquetas de Búsqueda:</span>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {selectedNode.attributes?.etiquetas && selectedNode.attributes.etiquetas.length > 0 ? (
                    selectedNode.attributes.etiquetas.map((tag, idx) => (
                      <span 
                        key={idx} 
                        style={{ 
                          fontSize: '10px', 
                          background: 'rgba(168, 85, 247, 0.1)', 
                          border: '1px solid rgba(168, 85, 247, 0.25)', 
                          color: '#c084fc', 
                          padding: '2px 8px', 
                          borderRadius: '6px', 
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {tag}
                        {userRol === 'admin' && (
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveEtiqueta(tag);
                            }} 
                            style={{ cursor: 'pointer', color: '#ef4444', fontWeight: 700, marginLeft: '2px', fontSize: '12px' }}
                            title="Eliminar etiqueta"
                          >
                            ×
                          </span>
                        )}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>Sin etiquetas asignadas</span>
                  )}
                </div>

                {userRol === 'admin' && (
                  <>
                    <form 
                      onSubmit={handleAddEtiquetaSubmit} 
                      style={{ display: 'flex', gap: '6px', marginTop: '8px' }}
                    >
                      <input 
                        type="text" 
                        placeholder="Nueva etiqueta..."
                        list="subcategorias-sugeridas"
                        value={newEtiquetaInput}
                        onChange={(e) => setNewEtiquetaInput(e.target.value)}
                        style={{ 
                          flex: 1, 
                          background: '#121624', 
                          border: '1px solid rgba(255,255,255,0.08)', 
                          borderRadius: '6px', 
                          color: '#fff', 
                          padding: '4px 8px', 
                          fontSize: '11px', 
                          fontFamily: 'Outfit',
                          outline: 'none'
                        }}
                      />
                      <button 
                        type="submit" 
                        style={{ 
                          background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', 
                          border: 'none', 
                          borderRadius: '6px', 
                          color: '#fff',  
                        padding: '4px 10px', 
                        fontSize: '11px', 
                        fontWeight: 600,
                        cursor: 'pointer' 
                      }}
                    >
                      +
                    </button>
                    </form>
                    <datalist id="subcategorias-sugeridas">
                      {obtenerTodasLasSubcategoriasNames().map((name, index) => (
                        <option key={index} value={name} />
                      ))}
                    </datalist>
                  </>
                )}
              </div>

              {/* Sección de Fotografía para Ubicaciones Físicas */}
              {selectedNode.attributes?.es_ubicacion_fisica && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#8f9cae', fontWeight: 500 }}>📸 Fotografía de Ubicación:</span>
                    {userRol === 'admin' && (
                      <button 
                        onClick={() => nodeImageUploadRef.current.click()} 
                        style={{ border: 'none', background: 'none', color: '#c084fc', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        {selectedNode.attributes?.detalles_ubicacion?.imagen_url ? "Cambiar Foto" : "Subir Foto"}
                      </button>
                    )}
                  </div>
                  
                  {selectedNode.attributes?.detalles_ubicacion?.imagen_url ? (
                    <div 
                      onClick={() => {
                        setPreviewFileName(`Foto de ${selectedNode.name}`);
                        setPreviewFileUrl(`${API_BASE_URL}${selectedNode.attributes.detalles_ubicacion.imagen_url}`);
                        setPreviewFileType('image');
                        setShowPreviewModal(true);
                      }}
                      style={{ height: '110px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(168, 85, 247, 0.2)', cursor: 'pointer', position: 'relative' }}
                      title="Haga clic para expandir"
                      className="hover-scale"
                    >
                      <img 
                        src={`${API_BASE_URL}${selectedNode.attributes.detalles_ubicacion.imagen_url}`} 
                        alt="Ubicación Física" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '4px', textAlign: 'center', fontSize: '9px', color: '#c084fc' }}>
                        Expandir Vista 🔍
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => {
                        if (userRol === 'admin') nodeImageUploadRef.current.click();
                      }}
                      style={{ 
                        height: '70px', 
                        borderRadius: '6px', 
                        border: '1px dashed rgba(255, 255, 255, 0.1)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '11px',
                        color: '#64748b',
                        cursor: userRol === 'admin' ? 'pointer' : 'default',
                        transition: 'border-color 0.2s'
                      }}
                      className={userRol === 'admin' ? "hover-scale" : ""}
                    >
                      {userRol === 'admin' ? "⚠️ Subir foto para este contenedor" : "Sin fotografía física"}
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={nodeImageUploadRef} 
                    onChange={handleNodeImageUpload} 
                    style={{ display: 'none' }} 
                    accept="image/*" 
                  />
                </div>
              )}

              {/* Sección de Personas Vinculadas a la Categoría */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#8f9cae', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={12} color="#c084fc" /> Miembros Vinculados:</span>
                  {userRol === 'admin' && (
                    <button 
                      onClick={() => {
                        setLinkTargetType('nodo');
                        setLinkTargetId(selectedNode.attributes?.id);
                        setLinkTargetName(selectedNode.name);
                        setShowLinkPersonaModal(true);
                      }} 
                      style={{ border: 'none', background: 'none', color: '#c084fc', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      ➕ Vincular
                    </button>
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                  {selectedNode.attributes?.personas_vinculadas && selectedNode.attributes.personas_vinculadas.length > 0 ? (
                    selectedNode.attributes.personas_vinculadas.map(pv => {
                      let rolColor = '#3b82f6';
                      if (pv.rol === 'docente') rolColor = '#22c55e';
                      else if (pv.rol === 'administrativo') rolColor = '#eab308';
                      return (
                        <div key={pv.vinculo_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', fontSize: '11px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div 
                              style={{ 
                                width: '20px', 
                                height: '20px', 
                                borderRadius: '50%', 
                                background: rolColor,
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyCenter: 'center',
                                fontSize: '9px',
                                fontWeight: 700
                              }}
                              title={`${pv.nombre_completo} (${pv.rol})`}
                            >
                              {pv.nombre_completo.charAt(0)}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600, color: '#fff' }}>{pv.nombre_completo}</span>
                              <span style={{ fontSize: '9px', color: '#8f9cae' }}>{pv.tipo_relacion} (Peso {pv.peso})</span>
                            </div>
                          </div>
                          {userRol === 'admin' && (
                            <button 
                              onClick={() => handleDeleteVinculoPersona(pv.vinculo_id, 'nodo', selectedNode.attributes?.id)} 
                              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                              <X size={12} color="#f87171" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <span style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', padding: '6px' }}>Sin personas vinculadas</span>
                  )}
                </div>
              </div>

              {/* Sección de Permisos de Acceso a la Categoría (Solo Admin) */}
              {userRol === 'admin' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#8f9cae', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Key size={12} color="#a855f7" /> Permisos de Acceso:
                    </span>
                  </div>
                  
                  {/* Lista de Permisos actuales */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '100px', overflowY: 'auto' }}>
                    {permisosNodo.length > 0 ? (
                      permisosNodo.map(perm => (
                        <div key={perm.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', fontSize: '11px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600, color: '#fff' }}>
                              {perm.usuario ? perm.usuario.username : `💼 Rol: ${perm.rol_organizacion?.nombre}`}
                            </span>
                            <span style={{ 
                              fontSize: '9px', 
                              color: perm.tipo_permiso === 'escritura' ? '#4ade80' : '#60a5fa', 
                              background: perm.tipo_permiso === 'escritura' ? 'rgba(74,222,128,0.1)' : 'rgba(96,165,250,0.1)',
                              border: perm.tipo_permiso === 'escritura' ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(96,165,250,0.2)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              textTransform: 'uppercase'
                            }}>
                              {perm.tipo_permiso}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDeletePermisoNodo(perm.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            title="Revocar acceso"
                          >
                            <X size={12} color="#f87171" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <span style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', padding: '6px' }}>
                        Acceso libre (solo limitado por rol global)
                      </span>
                    )}
                  </div>

                  {/* Formulario para asignar nuevos permisos */}
                  <form onSubmit={handleCreatePermisoNodo} style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '4px' }}>
                    
                    {/* Selector de Tipo de Destinatario */}
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', padding: '2px', gap: '2px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedPermisoDestinatarioType('usuario')}
                        style={{
                          flex: 1,
                          background: selectedPermisoDestinatarioType === 'usuario' ? 'rgba(168, 85, 247, 0.2)' : 'none',
                          border: 'none',
                          color: selectedPermisoDestinatarioType === 'usuario' ? '#c084fc' : '#8f9cae',
                          padding: '4px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Usuario
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPermisoDestinatarioType('rol')}
                        style={{
                          flex: 1,
                          background: selectedPermisoDestinatarioType === 'rol' ? 'rgba(168, 85, 247, 0.2)' : 'none',
                          border: 'none',
                          color: selectedPermisoDestinatarioType === 'rol' ? '#c084fc' : '#8f9cae',
                          padding: '4px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Rol Org.
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {selectedPermisoDestinatarioType === 'usuario' ? (
                        <select
                          value={selectedPermisoUsuarioId}
                          onChange={(e) => setSelectedPermisoUsuarioId(e.target.value)}
                          required
                          style={{
                            flex: 1,
                            background: '#121624',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '6px',
                            color: '#fff',
                            padding: '6px',
                            fontSize: '11px',
                            fontFamily: 'Outfit',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="">-- Elegir Usuario --</option>
                          {usuarios.filter(u => u.rol !== 'admin').map(usr => (
                            <option key={`perm-usr-${usr.id}`} value={usr.id}>{usr.username}</option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={selectedPermisoRolId}
                          onChange={(e) => setSelectedPermisoRolId(e.target.value)}
                          required
                          style={{
                            flex: 1,
                            background: '#121624',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '6px',
                            color: '#fff',
                            padding: '6px',
                            fontSize: '11px',
                            fontFamily: 'Outfit',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="">-- Elegir Rol --</option>
                          {rolesOrganizacion.map(rol => (
                            <option key={`perm-rol-${rol.id}`} value={rol.id}>{rol.nombre}</option>
                          ))}
                        </select>
                      )}

                      <select
                        value={selectedPermisoTipo}
                        onChange={(e) => setSelectedPermisoTipo(e.target.value)}
                        style={{
                          background: '#121624',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          color: '#fff',
                          padding: '6px',
                          fontSize: '11px',
                          fontFamily: 'Outfit',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="lectura">Lectura</option>
                        <option value="escritura">Escritura</option>
                      </select>

                      <button
                        type="submit"
                        style={{
                          background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#fff',
                          padding: '6px 12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Otorgar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Sección de Enlaces Cruzados de la Categoría */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#8f9cae', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}><Layers size={12} color="#22c55e" /> Enlaces Cruzados:</span>
                  {userRol === 'admin' && (
                    <button 
                      onClick={() => {
                        setLinkTargetType('nodo');
                        setLinkTargetId(selectedNode.attributes?.id);
                        setLinkTargetName(selectedNode.name);
                        setShowLinkCruzadoModal(true);
                      }} 
                      style={{ border: 'none', background: 'none', color: '#22c55e', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      ➕ Crear Enlace
                    </button>
                  )}
                </div>
                <span style={{ fontSize: '9px', color: '#64748b' }}>Permite que esta carpeta aparezca como acceso directo en otras carpetas.</span>
              </div>

              {/* Botonera de Opciones */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <button onClick={() => setShowQrModal(true)} className="glass-card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#fff', padding: '10px', fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}>
                  <QrCode size={12} color="#c084fc" /> Ficha QR
                </button>
                <button onClick={handleExportCSV} className="glass-card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#fff', padding: '10px', fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}>
                  <FileSpreadsheet size={12} color="#22c55e" /> Reporte CSV
                </button>
                {userRol === 'admin' && (
                  <>
                    <button 
                      onClick={() => {
                        setMoveElementType('nodo');
                        setMoveElementId(selectedNode.attributes?.id);
                        setMoveElementName(selectedNode.name);
                        setMoveElementIsPhysical(selectedNode.attributes?.es_ubicacion_fisica ?? false);
                        setShowMoveModal(true);
                      }}
                      className="glass-card" 
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc', border: '1px solid rgba(168,85,247,0.2)', padding: '10px', cursor: 'pointer' }}
                      title="Mover Categoría / Contenedor Físico"
                    >
                      <Sliders size={12} />
                    </button>
                    <button onClick={handleDeleteNodeClick} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '10px', cursor: 'pointer' }} title="Eliminar Categoría">
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Listado DMS completo de archivos */}
            <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#8f9cae', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Archivos DMS Registrados</span>
                {(userRol === 'admin' || selectedNode?.attributes?.puede_escribir === true) && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => {
                        if (selectedNode.attributes?.es_ubicacion_fisica) {
                          setScannedPhysicalNodeId(selectedNode.attributes.id);
                          setScannedLogicalNodeId('');
                        } else {
                          setScannedLogicalNodeId(selectedNode.attributes.id);
                          setScannedPhysicalNodeId('');
                        }
                        setScannedFileName(`Escaneo_${selectedNode.attributes?.codigo || 'DOC'}_${Date.now().toString().slice(-4)}.jpg`);
                        setShowScannerModal(true);
                      }} 
                      style={{ border: 'none', background: 'none', color: '#a855f7', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Camera size={13} /> Escanear Activo
                    </button>
                    <button onClick={handleFileUploadClick} style={{ border: 'none', background: 'none', color: '#c084fc', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Upload size={13} /> Registrar Archivo
                    </button>
                  </div>
                )}
              </div>

              {/* Contenedor Scrollable */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <div key={doc.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {doc.estado?.color ? (
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: doc.estado.color, boxShadow: `0 0 8px ${doc.estado.color}` }} title={`Fase: ${doc.estado.nombre}`} />
                          ) : (
                            <FileText size={15} color="#ef4444" />
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 500, color: '#fff', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nombre_archivo}</h4>
                            <span style={{ fontSize: '9px', color: '#8f9cae' }}>v{doc.version} {doc.estado ? `· ${doc.estado.nombre}` : ''}</span>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <button 
                            onClick={() => {
                              setPreviewFileName(doc.nombre_archivo);
                              setPreviewFileUrl(`${API_BASE_URL}${doc.ruta_archivo}`);
                              
                              const ext = doc.nombre_archivo.split('.').pop().toLowerCase();
                              if (ext === 'pdf') setPreviewFileType('pdf');
                              else if (['doc','docx','xls','xlsx'].includes(ext)) setPreviewFileType('office');
                              else if (['png','jpg','jpeg','gif'].includes(ext)) setPreviewFileType('image');
                              else setPreviewFileType('generic');
                              
                              setShowPreviewModal(true);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                            title="Previsualizar PDF"
                          >
                            <Eye size={13} color="#c084fc" />
                          </button>
                          <a href={`${API_BASE_URL}${doc.ruta_archivo}`} download style={{ display: 'flex', alignItems: 'center', padding: '4px' }}>
                            <Download size={13} color="#8f9cae" />
                          </a>
                          {(userRol === 'admin' || selectedNode?.attributes?.puede_escribir === true) && (
                            <>
                              <button 
                                onClick={() => {
                                  setMoveElementType('documento');
                                  setMoveElementId(doc.id);
                                  setMoveElementName(doc.nombre_archivo);
                                  setShowMoveModal(true);
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                title="Mover Archivo a otra carpeta"
                              >
                                <ChevronsRight size={13} color="#22c55e" />
                              </button>
                              <button 
                                onClick={(e) => handleDeleteDocumentClick(e, doc)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                              >
                                <Trash2 size={13} color="#ef4444" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px', padding: '6px 8px', border: '1px solid rgba(255,255,255,0.03)', marginTop: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
                          <span style={{ color: '#8f9cae' }}>📂 Lógico:</span>
                          <span style={{ color: doc.nodo ? '#c084fc' : '#475569', fontWeight: doc.nodo ? 600 : 400, fontFamily: 'monospace' }}>
                            {doc.nodo ? doc.nodo.codigo_inteligente : 'No vinculado'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
                          <span style={{ color: '#8f9cae' }}>📍 Físico:</span>
                          <span style={{ color: doc.ubicacion_fisica ? '#22c55e' : '#475569', fontWeight: doc.ubicacion_fisica ? 600 : 400, fontFamily: 'monospace' }}>
                            {doc.ubicacion_fisica ? doc.ubicacion_fisica.codigo_inteligente : 'No vinculado'}
                          </span>
                        </div>
                      </div>

                      {/* Dropdown de cambio de estado para archivos DMS filtrado por FSM */}
                      {(userRol === 'admin' || selectedNode?.attributes?.puede_escribir === true) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px', marginTop: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '9px', color: '#8f9cae' }}>Cambiar Fase:</span>
                            <select 
                              value={doc.estado?.id || ''}
                              onChange={(e) => handleChangeDocumentEstado(doc.id, e.target.value)}
                              style={{
                                background: '#121624',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '4px',
                                color: '#fff',
                                padding: '2px 6px',
                                fontSize: '10px',
                                fontFamily: 'Outfit',
                                outline: 'none',
                                cursor: 'pointer',
                                flex: 1
                              }}
                            >
                              <option style={{ background: '#121624', color: '#fff' }} value="">Sin Estado</option>
                              
                              {/* Filtrar y mapear los estados válidos por máquina de estados para archivos */}
                              {getValidosEstadosSiguientes(doc.estado?.nombre, 'archivo').map(est => (
                                <option style={{ background: '#121624', color: '#fff' }} key={`doc-state-${est.id}`} value={est.id}>#{est.secuencia} - {est.nombre}</option>
                              ))}
                              
                              {doc.estado?.nombre && (
                                <option style={{ background: '#121624', color: '#8f9cae' }} disabled value="">
                                  [Fase Actual: {doc.estado.nombre}]
                                </option>
                              )}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Personas Vinculadas al Archivo */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '9px', color: '#8f9cae', display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={10} /> Personas Vinculadas:</span>
                          {userRol === 'admin' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setLinkTargetType('documento');
                                setLinkTargetId(doc.id);
                                setLinkTargetName(doc.nombre_archivo);
                                setShowLinkPersonaModal(true);
                              }}
                              style={{ background: 'none', border: 'none', color: '#c084fc', fontSize: '9px', fontWeight: 600, cursor: 'pointer' }}
                            >
                              ➕ Vincular
                            </button>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {doc.personas_vinculadas && doc.personas_vinculadas.length > 0 ? (
                            doc.personas_vinculadas.map(pv => {
                              let rolColor = '#3b82f6';
                              if (pv.rol === 'docente') rolColor = '#22c55e';
                              else if (pv.rol === 'administrativo') rolColor = '#eab308';
                              return (
                                <div key={pv.vinculo_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '4px 6px', borderRadius: '4px' }}>
                                  <span style={{ color: '#fff', fontWeight: 500 }} title={`${pv.nombre_completo} (${pv.rol})`}>
                                    <span style={{ color: rolColor, marginRight: '4px' }}>●</span>
                                    {pv.nombre_completo} ({pv.tipo_relacion} - Peso {pv.peso})
                                  </span>
                                  {userRol === 'admin' && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteVinculoPersona(pv.vinculo_id, 'documento', doc.id);
                                      }}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                                    >
                                      <X size={10} color="#f87171" />
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <span style={{ fontSize: '9px', color: '#475569', fontStyle: 'italic' }}>Sin personas vinculadas</span>
                          )}
                        </div>
                      </div>

                      {/* Enlace Cruzado para Archivos */}
                      {userRol === 'admin' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px', marginTop: '4px' }}>
                          <span style={{ fontSize: '9px', color: '#8f9cae', display: 'flex', alignItems: 'center', gap: '4px' }}><Layers size={10} /> Enlaces Cruzados:</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLinkTargetType('documento');
                              setLinkTargetId(doc.id);
                              setLinkTargetName(doc.nombre_archivo);
                              setShowLinkCruzadoModal(true);
                            }}
                            style={{ background: 'none', border: 'none', color: '#22c55e', fontSize: '9px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            ➕ Crear Enlace
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#475569', marginTop: '20px' }}>
                    <Folder size={32} color="#1e293b" />
                    <span style={{ fontSize: '11px', color: '#64748b' }}>No hay archivos asociados en la nube.</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )
      ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#64748b', padding: '24px' }}>
            <Layers size={40} color="#1e293b" />
            <span style={{ fontSize: '12px', textAlign: 'center' }}>Selecciona una categoría para ver sus metadatos e historial de workflow.</span>
          </div>
        )}
      </section>
      )}

      {/* MODAL NUEVO ESTADO DE WORKFLOW */}
      {showAddEstadoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleCreateEstado} className="glass-panel" style={{ width: '420px', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 600, color: '#fff' }}>Añadir Estado de Workflow</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', position: 'relative' }}>
              
              {/* CAMPO: Nombre del Estado */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: '#8f9cae', fontWeight: 500 }}>Nombre del Estado</label>
                  <span 
                    onClick={() => setActiveTooltip(activeTooltip === 'nombre' ? null : 'nombre')}
                    style={{ color: 'var(--primary-glow)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                  >
                    <HelpCircle size={14} style={{ filter: 'drop-shadow(0 0 2px var(--primary-glow))' }} />
                  </span>
                </div>
                {activeTooltip === 'nombre' && (
                  <div style={{ position: 'absolute', top: '-75px', left: 0, right: 0, padding: '10px 12px', background: 'rgba(15,11,28,0.96)', border: '1px solid var(--primary-glow)', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', zIndex: 110, fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4', backdropFilter: 'blur(8px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#fff', marginBottom: '3px' }}>
                      <span>Ayuda: Nombre del Estado</span>
                      <span onClick={() => setActiveTooltip(null)} style={{ color: '#f87171', cursor: 'pointer' }}>✕</span>
                    </div>
                    Identificador de la fase. Ejemplos comunes: "Borrador" (redacción inicial), "En Revisión" o "Archivado" (fase final inmutable).
                  </div>
                )}
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Aprobado, Pendiente, Rechazado..."
                  value={newEstadoNombre}
                  onChange={(e) => setNewEstadoNombre(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Outfit' }}
                />
              </div>

              {/* CAMPO: Aplica A (Alcance) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: '#8f9cae', fontWeight: 500 }}>Aplica A (Tipo de Elemento)</label>
                  <span 
                    onClick={() => setActiveTooltip(activeTooltip === 'aplicaA' ? null : 'aplicaA')}
                    style={{ color: 'var(--primary-glow)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                  >
                    <HelpCircle size={14} style={{ filter: 'drop-shadow(0 0 2px var(--primary-glow))' }} />
                  </span>
                </div>
                {activeTooltip === 'aplicaA' && (
                  <div style={{ position: 'absolute', top: '-90px', left: 0, right: 0, padding: '10px 12px', background: 'rgba(15,11,28,0.96)', border: '1px solid var(--primary-glow)', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', zIndex: 110, fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4', backdropFilter: 'blur(8px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#fff', marginBottom: '3px' }}>
                      <span>Ayuda: Alcance de Aplicación</span>
                      <span onClick={() => setActiveTooltip(null)} style={{ color: '#f87171', cursor: 'pointer' }}>✕</span>
                    </div>
                    Define el límite del estado: "Ambos" aplica a todo; "Sólo Categorías" aplica únicamente a carpetas lógicas; "Sólo Archivos" aplica a los documentos finales para regir sus transiciones.
                  </div>
                )}
                <select 
                  value={newEstadoAplicaA}
                  onChange={(e) => setNewEstadoAplicaA(e.target.value)}
                  style={{ background: '#121624', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Outfit', cursor: 'pointer' }}
                >
                  <option style={{ background: '#121624', color: '#fff' }} value="ambos">Categorías y Archivos (Ambos)</option>
                  <option style={{ background: '#121624', color: '#fff' }} value="categoria">Sólo Categorías (Carpetas)</option>
                  <option style={{ background: '#121624', color: '#fff' }} value="archivo">Sólo Archivos Finales (Documentos)</option>
                </select>
              </div>

              {/* CAMPO: Color Neón */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: '#8f9cae', fontWeight: 500 }}>Color de Representación Neón</label>
                  <span 
                    onClick={() => setActiveTooltip(activeTooltip === 'color' ? null : 'color')}
                    style={{ color: 'var(--primary-glow)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                  >
                    <HelpCircle size={14} style={{ filter: 'drop-shadow(0 0 2px var(--primary-glow))' }} />
                  </span>
                </div>
                {activeTooltip === 'color' && (
                  <div style={{ position: 'absolute', top: '-75px', left: 0, right: 0, padding: '10px 12px', background: 'rgba(15,11,28,0.96)', border: '1px solid var(--primary-glow)', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', zIndex: 110, fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4', backdropFilter: 'blur(8px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#fff', marginBottom: '3px' }}>
                      <span>Ayuda: Color de Representación</span>
                      <span onClick={() => setActiveTooltip(null)} style={{ color: '#f87171', cursor: 'pointer' }}>✕</span>
                    </div>
                    Color asignado a esta fase. Se reflejará en las insignias, nodos del árbol interactivo y bordes decorativos en la terminal de la consola para identificar visualmente la fase.
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={newEstadoColor}
                    onChange={(e) => setNewEstadoColor(e.target.value)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', width: '40px', height: '40px', padding: 0 }}
                  />
                  <input 
                    type="text" 
                    value={newEstadoColor}
                    onChange={(e) => setNewEstadoColor(e.target.value)}
                    placeholder="#a855f7"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Outfit', flex: 1 }}
                  />
                </div>
              </div>

              {/* CAMPO: Secuencia */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: '#8f9cae', fontWeight: 500 }}>Secuencia / Orden (Número)</label>
                  <span 
                    onClick={() => setActiveTooltip(activeTooltip === 'secuencia' ? null : 'secuencia')}
                    style={{ color: 'var(--primary-glow)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                  >
                    <HelpCircle size={14} style={{ filter: 'drop-shadow(0 0 2px var(--primary-glow))' }} />
                  </span>
                </div>
                {activeTooltip === 'secuencia' && (
                  <div style={{ position: 'absolute', top: '-75px', left: 0, right: 0, padding: '10px 12px', background: 'rgba(15,11,28,0.96)', border: '1px solid var(--primary-glow)', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', zIndex: 110, fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4', backdropFilter: 'blur(8px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#fff', marginBottom: '3px' }}>
                      <span>Ayuda: Orden de Secuencia</span>
                      <span onClick={() => setActiveTooltip(null)} style={{ color: '#f87171', cursor: 'pointer' }}>✕</span>
                    </div>
                    Valor numérico entero (inicia en 1) que determina la jerarquía cronológica de la fase. Los estados con número menor preceden a los de número mayor.
                  </div>
                )}
                <input 
                  type="number" 
                  required
                  min={1}
                  value={newEstadoSecuencia}
                  onChange={(e) => setNewEstadoSecuencia(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Outfit' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button"
                onClick={() => setShowAddEstadoModal(false)}
                className="glass-card"
                style={{ flex: 1, color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="btn-primary"
                style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Crear Estado
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL NUEVA SUBCATEGORÍA */}
      {/* MODAL CONFIRMAR RESTABLECIMIENTO DE SISTEMA */}
      {showResetConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '420px', padding: '30px', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: '0 0 30px rgba(239, 68, 68, 0.25)', margin: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', background: '#0a090f' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)' }}>
                <AlertTriangle size={28} color="#ef4444" className="retencion-alerta-blink" />
              </div>
              <h3 style={{ margin: '0', fontSize: '20px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>¿Inicializar Base de Datos?</h3>
              <p style={{ margin: '0', fontSize: '13px', color: '#9ca3af', lineHeight: '1.5' }}>
                Estás a punto de vaciar **completamente** el sistema. Se eliminarán permanentemente todas las jerarquías lógicas/físicas, documentos cargados, personas y roles creados.
              </p>
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px dashed rgba(239, 68, 68, 0.2)', padding: '10px 14px', borderRadius: '8px', fontSize: '11px', color: '#f87171', fontWeight: 500 }}>
                ⚠️ Esta acción es definitiva y no se puede deshacer.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', marginTop: '5px' }}>
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="glass-card"
                style={{ flex: 1, color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetSistema}
                disabled={isResetting}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(239, 68, 68, 0.35)'
                }}
                className="hover-scale"
              >
                {isResetting ? 'Vaciando...' : 'Confirmar Restablecer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleAddChildNode} className="glass-panel" style={{ width: '440px', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', margin: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ margin: '0', fontSize: '20px', fontWeight: 600, color: '#fff' }}>Añadir Subcategoría / Ubicación</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: '#8f9cae', fontWeight: 500 }}>Nombre de la Categoría</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Facultad de Medicina, Aula 102..."
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Outfit' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: '#8f9cae', fontWeight: 500 }}>Abreviación (Máx. 10 letras)</label>
                <input 
                  type="text" 
                  required
                  maxLength={10}
                  placeholder="Ej: MED, CJ-FIN26"
                  value={newNodeAbbreviation}
                  onChange={(e) => setNewNodeAbbreviation(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Outfit' }}
                />
              </div>

              {/* Buscador de Padre Flexible */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
                <label style={{ fontSize: '13px', color: '#8f9cae', fontWeight: 500 }}>Contenedor o Categoría Padre</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '6px 12px' }}>
                  <Search size={14} color="#8f9cae" />
                  <input 
                    type="text" 
                    placeholder="Buscar padre por nombre o código..."
                    value={addParentSearchQuery}
                    onChange={(e) => setAddParentSearchQuery(e.target.value)}
                    style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: '12px', flex: 1, fontFamily: 'Outfit' }}
                  />
                  {addParentNode && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setAddParentNode(null);
                        setAddParentSearchQuery('');
                      }} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '11px', display: 'flex', alignItems: 'center' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Resultados flotantes de la búsqueda de padre */}
                {addParentSearchResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10000, background: '#0e1220', border: '1px solid rgba(168, 85, 247, 0.4)', borderRadius: '8px', marginTop: '4px', overflowY: 'auto', maxHeight: '180px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                    {addParentSearchResults.map((node) => (
                      <div 
                        key={`parent-search-res-${node.id}`}
                        onClick={() => {
                          setAddParentNode(node);
                          setAddParentSearchQuery(`${node.codigo} - ${node.nombre}`);
                          setAddParentSearchResults([]);
                        }}
                        style={{ padding: '8px 12px', fontSize: '11px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', transition: 'background 0.2s' }}
                        className="hover-scale"
                      >
                        <span style={{ color: node.es_ubicacion_fisica ? '#22c55e' : '#c084fc', fontWeight: 'bold' }}>
                          {node.es_ubicacion_fisica ? '📍' : '📂'}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: '#fff' }}>{node.nombre}</span>
                          <span style={{ fontSize: '9px', color: '#8f9cae', fontFamily: 'monospace' }}>{node.codigo}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {addParentNode ? (
                  <span style={{ fontSize: '10px', color: '#22c55e', marginTop: '2px' }}>
                    Vinculado a: <strong>{addParentNode.nombre} ({addParentNode.codigo})</strong>
                  </span>
                ) : (
                  <span style={{ fontSize: '10px', color: '#8f9cae', marginTop: '2px' }}>
                    Sin padre seleccionado (Se registrará en la Raíz Central).
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <input 
                  type="checkbox" 
                  id="physical"
                  checked={isPhysicalLocation}
                  onChange={(e) => setIsPhysicalLocation(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#a855f7' }}
                />
                <label htmlFor="physical" style={{ fontSize: '14px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>¿Es una ubicación física real?</label>
              </div>

              {/* Carga de Imagen (Solo si es Físico) */}
              {isPhysicalLocation && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', color: '#8f9cae', fontWeight: 500 }}>Foto de la Ubicación Física</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setNodeImageFile(e.target.files[0]);
                        }
                      }}
                      style={{ fontSize: '11px', color: '#cbd5e1', cursor: 'pointer' }}
                    />
                    {nodeImageFile && (
                      <span style={{ fontSize: '10px', color: '#22c55e' }}>
                        📸 Imagen cargada: {nodeImageFile.name}
                      </span>
                    )}
                  </div>

                  {/* Reglas de Retención (Meses Límite) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', color: '#8f9cae', fontWeight: 500 }}>Meses Límite de Retención (Regla Física)</label>
                    <input 
                      type="number" 
                      min={0}
                      placeholder="Ej: 12 (meses para alertar transferencia)"
                      value={newNodeRetentionMonths}
                      onChange={(e) => setNewNodeRetentionMonths(e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Outfit' }}
                    />
                  </div>

                  {/* Ubicación Destino de Transferencia */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', color: '#8f9cae', fontWeight: 500 }}>Ubicación Física Destino (Transferencia)</label>
                    <select 
                      value={newNodeTransferDestinationId}
                      onChange={(e) => setNewNodeTransferDestinationId(e.target.value)}
                      style={{ background: '#121624', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Outfit', cursor: 'pointer' }}
                    >
                      <option style={{ background: '#121624', color: '#fff' }} value="">-- Sin Destino (Fin de Ciclo) --</option>
                      {getDestinosElegibles(treeData, true).map(dest => (
                        <option style={{ background: '#121624', color: '#fff' }} key={`trans-dest-${dest.id}`} value={dest.id}>
                          {dest.codigo} - {dest.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Sección de Codificación Manual o Auto */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="checkbox" 
                    id="manual-code"
                    checked={isManualCodigoActive}
                    onChange={(e) => {
                      setIsManualCodigoActive(e.target.checked);
                      if (!e.target.checked) setManualCodigoInput('');
                    }}
                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#a855f7' }}
                  />
                  <label htmlFor="manual-code" style={{ fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
                    Ingresar código de forma manual
                  </label>
                </div>
                
                {isManualCodigoActive && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                    <span style={{ fontSize: '11px', color: '#8f9cae' }}>Código Personalizado:</span>
                    <input 
                      type="text" 
                      placeholder="Ej: FAC-MED-G25"
                      value={manualCodigoInput}
                      onChange={(e) => setManualCodigoInput(e.target.value)}
                      style={{ background: '#121624', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Outfit' }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifySelf: 'stretch', gap: '12px', marginTop: '8px' }}>
              <button 
                type="button"
                onClick={() => {
                  setNewNodeName('');
                  setNewNodeAbbreviation('');
                  setIsPhysicalLocation(false);
                  setAddParentNode(null);
                  setAddParentSearchQuery('');
                  setNodeImageFile(null);
                  setManualCodigoInput('');
                  setIsManualCodigoActive(false);
                  setShowAddModal(false);
                }}
                className="glass-card"
                style={{ flex: 1, color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="btn-primary"
                style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Añadir Nodo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE CÓDIGO QR */}
      {showQrModal && selectedNode && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '360px', padding: '30px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ alignSelf: 'flex-end', cursor: 'pointer' }} onClick={() => setShowQrModal(false)}>
              <X size={20} color="#8f9cae" />
            </div>
            
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#fff', fontWeight: 600 }}>Ficha de Código QR</h3>
            <span style={{ fontSize: '12px', color: '#8f9cae', marginBottom: '20px', fontFamily: 'monospace' }}>{selectedNode.attributes?.codigo}</span>
            
            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', marginBottom: '24px' }}>
              <img 
                src={`${API_BASE_URL}/nodos/${selectedNode.attributes.id}/qr`} 
                alt="Código QR" 
                style={{ width: '200px', height: '200px', display: 'block' }}
              />
            </div>

            <div style={{ display: 'flex', width: '100%', gap: '10px' }}>
              <button 
                onClick={() => setShowQrModal(false)}
                className="glass-card"
                style={{ flex: 1, padding: '10px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}
              >
                Cerrar
              </button>
              <button 
                onClick={handleDownloadQr}
                className="btn-primary"
                style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Download size={14} /> Descargar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VISOR HÍBRIDO DE DOCUMENTOS */}
      {showPreviewModal && previewFileUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
          <div className="glass-panel" style={{ width: '80%', height: '80%', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.08)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>Visor de Documentos DMS</h3>
                <span style={{ fontSize: '11px', color: '#8f9cae' }}>{previewFileName}</span>
              </div>
              <div style={{ cursor: 'pointer' }} onClick={() => { setShowPreviewModal(false); setPreviewFileUrl(''); }}>
                <X size={22} color="#8f9cae" />
              </div>
            </div>
            
            <div style={{ flex: 1, background: '#10141f', borderRadius: '8px', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              
              {previewFileType === 'pdf' && (
                <iframe 
                  src={previewFileUrl} 
                  width="100%" 
                  height="100%" 
                  title="Visor PDF"
                  style={{ border: 'none' }}
                />
              )}

              {previewFileType === 'office' && (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '40px', boxSizing: 'border-box', overflowY: 'auto' }}>
                  {previewFileName.endsWith('.xlsx') || previewFileName.endsWith('.xls') ? (
                    <div style={{ background: '#1b2030', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '20px', width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#22c55e' }}>📊 Hoja de Cálculo: AV Spreadsheet Stream</span>
                        <span style={{ fontSize: '11px', color: '#8f9cae' }}>Solo lectura</span>
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#fff' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                            <th style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>Periodo</th>
                            <th style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>Concepto</th>
                            <th style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>Monto</th>
                            <th style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>Q1 - 2026</td>
                            <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>Gastos Operativos</td>
                            <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.08)', color: '#ef4444' }}>-$45,000</td>
                            <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.08)', color: '#22c55e' }}>Aprobado</td>
                          </tr>
                          <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>Q2 - 2026</td>
                            <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>Ingreso Licencias Ecosistema</td>
                            <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.08)', color: '#22c55e' }}>+$125,000</td>
                            <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.08)', color: '#22c55e' }}>Aprobado</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>Q3 - 2026</td>
                            <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>Mantenimiento Servidores</td>
                            <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.08)', color: '#ef4444' }}>-$15,000</td>
                            <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.08)', color: '#eab308' }}>Pendiente</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ background: '#fff', color: '#333', padding: '40px', borderRadius: '4px', width: '100%', maxWidth: '600px', margin: '0 auto', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', boxSizing: 'border-box' }}>
                      <div style={{ borderBottom: '2px solid #a855f7', paddingBottom: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#a855f7' }}>ARCHI-VITE OFFICE SUITE</span>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>CONFIDENCIAL</span>
                      </div>
                      <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', color: '#111' }}>{previewFileName}</h2>
                      <p style={{ fontSize: '12px', lineHeight: 1.6 }}>Este documento de oficina ha sido cargado con éxito en el Ecosistema DMS de Archi-vite.</p>
                      <p style={{ fontSize: '12px', lineHeight: 1.6 }}>Se registran las firmas y aprobaciones de los directores académicos para proceder a su archivado físico.</p>
                    </div>
                  )}
                </div>
              )}

              {previewFileType === 'image' && (
                <img 
                  src={previewFileUrl} 
                  alt="Previsualización" 
                  style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px' }}
                />
              )}

              {previewFileType === 'generic' && (
                <div style={{ textAlign: 'center', color: '#8f9cae', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                  <FileWarning size={48} color="#eab308" />
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '16px' }}>Formato no previsualizable directamente</h4>
                    <p style={{ margin: 0, fontSize: '13px' }}>Puedes descargar este archivo para visualizarlo con tu programa local de Windows.</p>
                  </div>
                  <a 
                    href={previewFileUrl} 
                    download 
                    className="btn-primary"
                    style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Download size={14} /> Descargar Archivo
                  </a>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* CONFIRMACIÓN DE SEGURIDAD CUSTOM */}
      {confirmModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 }}>
          <div 
            className="glass-panel" 
            style={{ 
              width: '420px', 
              padding: '32px', 
              borderRadius: '16px', 
              border: confirmModal.requireTextConfirm ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(168, 85, 247, 0.4)', 
              boxShadow: confirmModal.requireTextConfirm 
                ? '0 0 25px rgba(239, 68, 68, 0.15)' 
                : '0 0 25px rgba(168, 85, 247, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                background: confirmModal.requireTextConfirm ? 'rgba(239, 68, 68, 0.1)' : 'rgba(168, 85, 247, 0.1)', 
                width: '36px', 
                height: '36px', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <AlertTriangle size={20} color={confirmModal.requireTextConfirm ? '#ef4444' : '#a855f7'} />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>{confirmModal.title}</h3>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>{confirmModal.message}</p>

            {confirmModal.requireTextConfirm && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 500 }}>Escribe "ELIMINAR" en mayúsculas:</span>
                <input 
                  type="text"
                  placeholder="ELIMINAR"
                  value={confirmModal.inputValue}
                  onChange={(e) => setConfirmModal(prev => ({ ...prev, inputValue: e.target.value }))}
                  style={{ 
                    background: 'rgba(239, 68, 68, 0.05)', 
                    border: '1px solid rgba(239, 68, 68, 0.2)', 
                    borderRadius: '8px', 
                    padding: '10px 12px', 
                    color: '#fff', 
                    fontSize: '13px', 
                    outline: 'none', 
                    fontFamily: 'monospace',
                    letterSpacing: '0.1em',
                    textAlign: 'center'
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                className="glass-card"
                style={{ flex: 1, padding: '12px', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                disabled={confirmModal.requireTextConfirm && confirmModal.inputValue !== 'ELIMINAR'}
                className="btn-primary"
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  borderRadius: '8px', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  background: confirmModal.requireTextConfirm 
                    ? (confirmModal.inputValue === 'ELIMINAR' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'rgba(239, 68, 68, 0.2)')
                    : 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                  color: confirmModal.requireTextConfirm && confirmModal.inputValue !== 'ELIMINAR' ? '#64748b' : '#fff',
                  border: 'none',
                  opacity: confirmModal.requireTextConfirm && confirmModal.inputValue !== 'ELIMINAR' ? 0.5 : 1,
                  boxShadow: confirmModal.requireTextConfirm && confirmModal.inputValue === 'ELIMINAR' ? '0 0 15px rgba(239, 68, 68, 0.3)' : 'none'
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RE-UBICACIÓN / MOVIMIENTO DE ELEMENTOS */}
      {showMoveModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11500 }}>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const targetIdVal = moveTargetId === 'raiz' ? '' : moveTargetId;
              
              let url = "";
              if (moveElementType === 'nodo') {
                url = `${API_BASE_URL}/nodos/${moveElementId}/mover?nuevo_parent_id=${targetIdVal}`;
              } else {
                if (moveFileTypeSelect === 'logico') {
                  url = `${API_BASE_URL}/documentos/${moveElementId}/indexar?nodo_id=${targetIdVal}`;
                } else {
                  url = `${API_BASE_URL}/documentos/${moveElementId}/indexar?ubicacion_fisica_id=${targetIdVal}`;
                }
              }

              const runMove = async () => {
                try {
                  setIsLoading(true);
                  const res = await fetch(url, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                  });

                  if (res.ok) {
                    setShowMoveModal(false);
                    setMoveTargetId('');
                    await fetchTreeData();
                    setTreeKey(prev => prev + 1);
                    if (selectedNode) {
                      if (moveElementType === 'nodo' && moveElementId === selectedNode.attributes?.id) {
                        setSelectedNode(null);
                      } else {
                        await fetchDocuments(selectedNode.attributes.id);
                      }
                    }
                    triggerNotification("Movimiento Completado", "El activo lógico/físico ha sido re-ubicado con éxito.");
                  } else {
                    const errData = await res.json();
                    alert(`Error: ${errData.detail || 'No se pudo mover el elemento'}`);
                  }
                } catch (err) {
                  console.error(err);
                  alert("Error de red al mover el elemento.");
                } finally {
                  setIsLoading(false);
                }
              };
              runMove();
            }}
            className="glass-panel" 
            style={{ 
              width: '450px', 
              padding: '30px', 
              borderRadius: '16px', 
              border: '1px solid rgba(168, 85, 247, 0.4)', 
              boxShadow: '0 0 25px rgba(168, 85, 247, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                background: 'rgba(168, 85, 247, 0.1)', 
                width: '36px', 
                height: '36px', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Sliders size={20} color="#c084fc" />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                {moveElementType === 'nodo' ? 'Re-ubicar Categoría/Ubicación' : 'Vincular / Re-ubicar Archivo DMS'}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#8f9cae' }}>Elemento a mover:</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', display: 'inline-block' }}>
                {moveElementName}
              </span>
            </div>

            {moveElementType === 'documento' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>Estructura de Vinculación a Modificar:</span>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="moveFileTypeSelect" 
                      value="logico" 
                      checked={moveFileTypeSelect === 'logico'} 
                      onChange={() => {
                        setMoveFileTypeSelect('logico');
                        setMoveTargetId('');
                      }} 
                    />
                    📂 Estructura Lógica
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="moveFileTypeSelect" 
                      value="fisico" 
                      checked={moveFileTypeSelect === 'fisico'} 
                      onChange={() => {
                        setMoveFileTypeSelect('fisico');
                        setMoveTargetId('');
                      }} 
                    />
                    📍 Estructura Física
                  </label>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>Seleccione Destino:</label>
              <select
                value={moveTargetId}
                onChange={(e) => setMoveTargetId(e.target.value)}
                required
                style={{
                  background: '#121624',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '10px 14px',
                  fontSize: '13px',
                  fontFamily: 'Outfit',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option style={{ background: '#121624', color: '#fff' }} value="">-- Seleccionar Destino --</option>
                {moveElementType === 'nodo' && (
                  <option style={{ background: '#121624', color: '#fff' }} value="raiz">Raíz Central (Sin padre)</option>
                )}
                {getDestinosElegibles(
                  treeData, 
                  moveElementType === 'nodo' ? moveElementIsPhysical : (moveFileTypeSelect === 'fisico')
                ).map(dest => (
                  <option style={{ background: '#121624', color: '#fff' }} key={`move-dest-${dest.id}`} value={dest.id}>
                    {dest.codigo} - {dest.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                type="button"
                onClick={() => {
                  setShowMoveModal(false);
                  setMoveTargetId('');
                }}
                className="glass-card"
                style={{ flex: 1, padding: '12px', color: '#fff', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="btn-primary"
                style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                {moveElementType === 'nodo' ? 'Confirmar Movimiento' : 'Confirmar Vinculación / Mover'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL CREAR PERSONA EN EL CATÁLOGO CENTRAL */}
      {showCreatePersonaModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11500 }}>
          <form 
            onSubmit={handleCreatePersona}
            className="glass-panel" 
            style={{ 
              width: '420px', 
              padding: '30px', 
              borderRadius: '16px', 
              border: '1px solid rgba(168, 85, 247, 0.4)', 
              boxShadow: '0 0 25px rgba(168, 85, 247, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                background: 'rgba(168, 85, 247, 0.1)', 
                width: '36px', 
                height: '36px', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <UserPlus size={20} color="#c084fc" />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                Registrar Persona
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>Identificación (DNI, Cédula o Registro):</label>
              <input 
                type="text" 
                required
                placeholder="Ej. DNI-87261 o 1045236"
                value={newPersonaIdentificacion}
                onChange={(e) => setNewPersonaIdentificacion(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Outfit' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>Nombre Completo:</label>
              <input 
                type="text" 
                required
                placeholder="Ej. Dr. Mario Quiroga"
                value={newPersonaNombre}
                onChange={(e) => setNewPersonaNombre(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Outfit' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>Rol del Ecosistema:</label>
              <select
                value={newPersonaRolId}
                onChange={(e) => setNewPersonaRolId(e.target.value)}
                required
                style={{
                  background: '#121624',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '10px',
                  fontSize: '13px',
                  fontFamily: 'Outfit',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {rolesOrganizacion.map(rol => (
                  <option style={{ background: '#121624', color: '#fff' }} key={`new-per-rol-${rol.id}`} value={rol.id}>{rol.nombre} ({rol.codigo})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>Departamento o Área:</label>
              <input 
                type="text" 
                placeholder="Ej. Finanzas, Operaciones, TI..."
                value={newPersonaCarrera}
                onChange={(e) => setNewPersonaCarrera(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Outfit' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
              <input 
                type="checkbox"
                id="create-user-checkbox"
                checked={newPersonaCrearUsuario}
                onChange={(e) => setNewPersonaCrearUsuario(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#a855f7' }}
              />
              <label htmlFor="create-user-checkbox" style={{ fontSize: '12.5px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
                Habilitar Cuenta de Usuario (Acceso al DMS)
              </label>
            </div>

            {newPersonaCrearUsuario && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>Nombre de Usuario (Username):</label>
                  <input 
                    type="text" 
                    required={newPersonaCrearUsuario}
                    placeholder="Ej. mquiroga"
                    value={newPersonaUsername}
                    onChange={(e) => setNewPersonaUsername(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Outfit' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', background: 'rgba(168, 85, 247, 0.03)', border: '1px dashed rgba(168, 85, 247, 0.2)', borderRadius: '8px', fontSize: '11px', color: '#c084fc', lineHeight: '1.4' }}>
                  🔑 <strong>Nota de Seguridad:</strong> La contraseña por defecto del usuario será exactamente su número de identificación. En su primer inicio de sesión, el sistema le obligará a definir una contraseña nueva.
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                type="button"
                onClick={() => {
                  setShowCreatePersonaModal(false);
                  setNewPersonaIdentificacion('');
                  setNewPersonaNombre('');
                  if (rolesOrganizacion.length > 0) {
                    setNewPersonaRolId(rolesOrganizacion[0].id);
                  }
                  setNewPersonaCarrera('');
                  setNewPersonaCrearUsuario(false);
                  setNewPersonaUsername('');
                  setNewPersonaPassword('');
                }}
                className="glass-card"
                style={{ flex: 1, padding: '12px', color: '#fff', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="btn-primary"
                style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL EXPEDIENTE CONSOLIDADO DE PERSONA */}
      {showExpedienteModal && selectedPersonaExpediente && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11500 }}>
          <div 
            className="glass-panel" 
            style={{ 
              width: '800px', 
              maxHeight: '85vh',
              padding: '30px', 
              borderRadius: '16px', 
              border: '1px solid rgba(168, 85, 247, 0.4)', 
              boxShadow: '0 0 25px rgba(168, 85, 247, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ 
                  background: 'rgba(168, 85, 247, 0.15)', 
                  width: '50px', 
                  height: '50px', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  👤
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#fff' }}>
                    {selectedPersonaExpediente.persona.nombre_completo}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#8f9cae', textTransform: 'uppercase', fontWeight: 600 }}>
                    {selectedPersonaExpediente.persona.rol} · {selectedPersonaExpediente.persona.carrera_departamento || 'Sin Departamento/Área'}
                  </span>
                </div>
              </div>
              <div style={{ cursor: 'pointer' }} onClick={() => setShowExpedienteModal(false)}>
                <X size={24} color="#8f9cae" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', fontSize: '12px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ color: '#8f9cae' }}>Código/Cédula:</span>
                <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>🪪 {selectedPersonaExpediente.persona.identificacion}</p>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ color: '#8f9cae' }}>Ecosistema Global:</span>
                <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#c084fc' }}>Archi-vite DMS (AV)</p>
              </div>
            </div>

            {/* EXPEDIENTE - SECCIÓN CATEGORÍAS */}
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#8f9cae', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categorías y Estantes Vinculados</h4>
              <div className="glass-panel" style={{ padding: '0', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#cbd5e1', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
                      <th style={{ padding: '10px 14px' }}>Código</th>
                      <th style={{ padding: '10px 14px' }}>Nombre</th>
                      <th style={{ padding: '10px 14px' }}>Tipo Estructura</th>
                      <th style={{ padding: '10px 14px' }}>Relación</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPersonaExpediente.categorias.length > 0 ? (
                      selectedPersonaExpediente.categorias.map(cat => (
                        <tr key={`exp-cat-${cat.id}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#c084fc', fontWeight: 600 }}>{cat.codigo}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#fff' }}>{cat.nombre}</td>
                          <td style={{ padding: '10px 14px', color: '#8f9cae' }}>{cat.es_ubicacion_fisica ? '📍 Física' : '📂 Lógica'}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <span style={{ color: '#fff', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', alignSelf: 'flex-start' }}>
                                {cat.tipo_relacion} (Peso {cat.peso})
                              </span>
                              <span style={{ fontSize: '9px', color: cat.rol_momento_color, background: `${cat.rol_momento_color}11`, border: `1px solid ${cat.rol_momento_color}22`, padding: '1px 5px', borderRadius: '3px', alignSelf: 'flex-start', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                                🕒 Rol: {cat.rol_momento_nombre}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                            <button
                              onClick={() => {
                                // Redireccionar
                                const targetId = cat.id;
                                const isPhysical = cat.es_ubicacion_fisica;
                                
                                const redirect = async () => {
                                  try {
                                    setIsLoading(true);
                                    const res = await fetch(`${API_BASE_URL}/nodos/arbol?tipo=${isPhysical ? 'fisico' : 'logico'}`, {
                                      headers: { 'Authorization': `Bearer ${token}` }
                                    });
                                    if (res.ok) {
                                      const dataTree = await res.json();
                                      const findNode = (r, id) => {
                                        if (r.attributes?.id === id) return r;
                                        if (r.children) {
                                          for (let c of r.children) {
                                            const found = findNode(c, id);
                                            if (found) return found;
                                          }
                                        }
                                        return null;
                                      };
                                      const targetNode = findNode(dataTree, targetId);
                                      if (targetNode) {
                                        setSelectedNode(targetNode);
                                        setTipoJerarquia(isPhysical ? 'fisico' : 'logico');
                                        setActiveMenu('jerarquias');
                                        setShowExpedienteModal(false);
                                      }
                                    }
                                  } catch (e) {
                                    console.error(e);
                                  } finally {
                                    setIsLoading(false);
                                  }
                                };
                                redirect();
                              }}
                              style={{ background: 'none', border: 'none', color: '#c084fc', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
                            >
                              🔗 Ir al Árbol
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Sin categorías vinculadas.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* EXPEDIENTE - SECCIÓN ARCHIVOS */}
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#8f9cae', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Documentos y Archivos DMS Vinculados</h4>
              <div className="glass-panel" style={{ padding: '0', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#cbd5e1', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
                      <th style={{ padding: '10px 14px' }}>Archivo</th>
                      <th style={{ padding: '10px 14px' }}>Versión</th>
                      <th style={{ padding: '10px 14px' }}>Fase Workflow</th>
                      <th style={{ padding: '10px 14px' }}>Relación</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPersonaExpediente.documentos.length > 0 ? (
                      selectedPersonaExpediente.documentos.map(doc => (
                        <tr key={`exp-doc-${doc.id}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#fff' }}>📄 {doc.nombre_archivo}</td>
                          <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>v{doc.version}</td>
                          <td style={{ padding: '10px 14px' }}>
                            {doc.estado_nombre ? (
                              <span style={{ color: doc.estado_color, border: `1px solid ${doc.estado_color}33`, padding: '2px 8px', borderRadius: '4px', background: `${doc.estado_color}11` }}>
                                {doc.estado_nombre}
                              </span>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <span style={{ color: '#fff', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', alignSelf: 'flex-start' }}>
                                {doc.tipo_relacion} (Peso {doc.peso})
                              </span>
                              <span style={{ fontSize: '9px', color: doc.rol_momento_color, background: `${doc.rol_momento_color}11`, border: `1px solid ${doc.rol_momento_color}22`, padding: '1px 5px', borderRadius: '3px', alignSelf: 'flex-start', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                                🕒 Rol: {doc.rol_momento_nombre}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => {
                                setPreviewFileName(doc.nombre_archivo);
                                setPreviewFileUrl(`${API_BASE_URL}${doc.ruta_archivo}`);
                                const ext = doc.nombre_archivo.split('.').pop().toLowerCase();
                                if (ext === 'pdf') setPreviewFileType('pdf');
                                else if (['doc','docx','xls','xlsx'].includes(ext)) setPreviewFileType('office');
                                else if (['png','jpg','jpeg','gif'].includes(ext)) setPreviewFileType('image');
                                else setPreviewFileType('generic');
                                
                                setShowPreviewModal(true);
                              }}
                              style={{ background: 'none', border: 'none', color: '#c084fc', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
                            >
                              Previsualizar
                            </button>
                            <a 
                              href={`${API_BASE_URL}${doc.ruta_archivo}`} 
                              download 
                              style={{ color: '#8f9cae', textDecoration: 'none', fontSize: '11px', fontWeight: 600 }}
                            >
                              Descargar
                            </a>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Sin archivos vinculados.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VINCULAR PERSONA A UN ACTIVO */}
      {showLinkPersonaModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11500 }}>
          <form 
            onSubmit={handleLinkPersonaSubmit}
            className="glass-panel" 
            style={{ 
              width: '420px', 
              padding: '30px', 
              borderRadius: '16px', 
              border: '1px solid rgba(168, 85, 247, 0.4)', 
              boxShadow: '0 0 25px rgba(168, 85, 247, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                background: 'rgba(168, 85, 247, 0.1)', 
                width: '36px', 
                height: '36px', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Users size={20} color="#c084fc" />
              </div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                Vincular Miembro a Activo
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#8f9cae' }}>Elemento Destino:</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                {linkTargetType === 'nodo' ? '📂' : '📄'} {linkTargetName}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
              <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>Buscar Persona en el Catálogo:</label>
              <input 
                type="text" 
                placeholder="Escriba nombre o código..."
                value={linkPersonaSearchQuery}
                onChange={(e) => setLinkPersonaSearchQuery(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Outfit' }}
              />
              {/* Resultados Predictivos */}
              {linkPersonaSearchResults.length > 0 && (
                <div style={{ position: 'absolute', top: '64px', left: 0, right: 0, background: '#101424', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '8px', zIndex: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {linkPersonaSearchResults.map(p => {
                    const rNombre = p.rol_actual ? p.rol_actual.nombre : 'Sin Rol';
                    return (
                      <div 
                        key={`search-per-${p.id}`}
                        onClick={() => {
                          setSelectedLinkPersona(p);
                          setLinkPersonaRolMomentoId(p.rol_actual_id || '');
                          setLinkPersonaSearchQuery(p.nombre_completo);
                          setLinkPersonaSearchResults([]);
                        }}
                        style={{ padding: '8px 12px', color: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                        className="hover-glow"
                      >
                        <span>👤 {p.nombre_completo}</span>
                        <span style={{ fontSize: '10px', color: '#8f9cae' }}>{rNombre} ({p.identificacion})</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Registrar en caliente si no existe */}
              {linkPersonaSearchQuery.trim().length > 0 && selectedLinkPersona?.nombre_completo !== linkPersonaSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setNewPersonaNombre(linkPersonaSearchQuery);
                    setShowCreatePersonaModal(true);
                  }}
                  style={{ background: 'rgba(168,85,247,0.1)', border: '1px dashed rgba(168,85,247,0.4)', color: '#c084fc', padding: '6px', fontSize: '11px', borderRadius: '6px', cursor: 'pointer', marginTop: '4px' }}
                >
                  ➕ ¿No figura en catálogo? Registrar "{linkPersonaSearchQuery}" en caliente
                </button>
              )}
            </div>

            {selectedLinkPersona && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>Persona Seleccionada:</span>
                <span style={{ fontSize: '12px', color: '#fff' }}>{selectedLinkPersona.nombre_completo} (Actual: {selectedLinkPersona.rol_actual ? selectedLinkPersona.rol_actual.nombre : 'Sin Rol'})</span>
                
                {/* SELECT DROPDOWN DE ROL DEL MOMENTO */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                  <label style={{ fontSize: '10px', color: '#cbd5e1' }}>Rol en el Momento de este Vínculo:</label>
                  <select
                    value={linkPersonaRolMomentoId}
                    onChange={(e) => setLinkPersonaRolMomentoId(e.target.value)}
                    style={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px', color: '#fff', fontSize: '11px', outline: 'none' }}
                  >
                    <option style={{ background: '#0b0f19', color: '#fff' }} value="">-- Usar rol actual por defecto --</option>
                    {rolesOrganizacion.map(rol => (
                      <option style={{ background: '#0b0f19', color: '#fff' }} key={`momento-rol-${rol.id}`} value={rol.id}>{rol.nombre} ({rol.codigo})</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>Tipo de Relación / Rol:</label>
              <input 
                type="text" 
                required
                placeholder="Ej. Propietario Principal, Revisor, Colaborador"
                value={linkPersonaTipoRelacion}
                onChange={(e) => setLinkPersonaTipoRelacion(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Outfit' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>Peso de Relevancia (1-10):</label>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#c084fc' }}>{linkPersonaPeso} ({linkPersonaPeso === 1 ? 'Máxima Relevancia' : linkPersonaPeso === 10 ? 'Mínima Relevancia' : 'Relevancia Media'})</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10"
                value={linkPersonaPeso}
                onChange={(e) => setLinkPersonaPeso(e.target.value)}
                style={{ cursor: 'pointer', accentColor: '#a855f7' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                type="button"
                onClick={() => {
                  setShowLinkPersonaModal(false);
                  setSelectedLinkPersona(null);
                  setLinkPersonaSearchQuery('');
                  setLinkPersonaTipoRelacion('Propietario');
                  setLinkPersonaPeso(5);
                }}
                className="glass-card"
                style={{ flex: 1, padding: '12px', color: '#fff', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={!selectedLinkPersona}
                className="btn-primary"
                style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: selectedLinkPersona ? 1 : 0.5 }}
              >
                Vincular
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL CREAR ENLACE CRUZADO (ACCESO DIRECTO) */}
      {showLinkCruzadoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11500 }}>
          <form 
            onSubmit={handleCreateEnlaceCruzado}
            className="glass-panel" 
            style={{ 
              width: '420px', 
              padding: '30px', 
              borderRadius: '16px', 
              border: '1px solid rgba(168, 85, 247, 0.4)', 
              boxShadow: '0 0 25px rgba(168, 85, 247, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                background: 'rgba(22, 197, 94, 0.1)', 
                width: '36px', 
                height: '36px', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Layers size={20} color="#22c55e" />
              </div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                Crear Acceso Directo Virtual
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#8f9cae' }}>Elemento Origen (El que se enlazará):</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                {linkTargetType === 'nodo' ? '📂' : '📄'} {linkTargetName}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
              <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>Buscar Carpeta Destino (Donde figurará):</label>
              <input 
                type="text" 
                placeholder="Escriba nombre o código de la carpeta..."
                value={linkCruzadoSearchQuery}
                onChange={(e) => setLinkCruzadoSearchQuery(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Outfit' }}
              />
              {/* Resultados Predictivos */}
              {linkCruzadoSearchResults.length > 0 && (
                <div style={{ position: 'absolute', top: '64px', left: 0, right: 0, background: '#101424', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', zIndex: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {linkCruzadoSearchResults.map(n => (
                    <div 
                      key={`search-node-${n.id}`}
                      onClick={() => {
                        setSelectedLinkCruzadoNode(n);
                        setLinkCruzadoSearchQuery(n.nombre);
                        setLinkCruzadoSearchResults([]);
                      }}
                      style={{ padding: '8px 12px', color: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                      className="hover-glow"
                    >
                      <span>📂 {n.nombre}</span>
                      <span style={{ fontSize: '10px', color: '#8f9cae' }}>{n.codigo} ({n.es_ubicacion_fisica ? 'Física' : 'Lógica'})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedLinkCruzadoNode && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>Carpeta Destino Seleccionada:</span>
                <span style={{ fontSize: '12px', color: '#fff' }}>{selectedLinkCruzadoNode.nombre} ({selectedLinkCruzadoNode.codigo})</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                type="button"
                onClick={() => {
                  setShowLinkCruzadoModal(false);
                  setSelectedLinkCruzadoNode(null);
                  setLinkCruzadoSearchQuery('');
                }}
                className="glass-card"
                style={{ flex: 1, padding: '12px', color: '#fff', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={!selectedLinkCruzadoNode}
                className="btn-primary"
                style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: selectedLinkCruzadoNode ? 1 : 0.5 }}
              >
                Crear Enlace
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL ASISTENTE DE ESCANEADO DUAL */}
      {showScannerModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11500 }}>
          <div 
            className="glass-panel" 
            style={{ 
              width: '900px', 
              height: '80vh',
              padding: '30px', 
              borderRadius: '16px', 
              border: '1px solid rgba(168, 85, 247, 0.4)', 
              boxShadow: '0 0 25px rgba(168, 85, 247, 0.15)',
              display: 'flex',
              gap: '24px'
            }}
          >
            {/* 1. Lado Izquierdo: Previsualización de Digitalización y Controles del Dispositivo */}
            <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '16px', borderRight: '1px solid rgba(255,255,255,0.06)', paddingRight: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Camera size={20} color="#a855f7" /> Asistente de Escaneado DMS
                </h3>
                {/* Selector de Origen */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '2px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    type="button"
                    onClick={() => { setScannerSource('twain'); stopCameraScan(); }}
                    style={{
                      background: scannerSource === 'twain' ? '#a855f7' : 'none',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    🖨️ TWAIN Fujitsu
                  </button>
                  <button
                    type="button"
                    onClick={() => { setScannerSource('camera'); startCameraScan(); }}
                    style={{
                      background: scannerSource === 'camera' ? '#a855f7' : 'none',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    📹 Escáner Web
                  </button>
                </div>
              </div>

              {/* Visor del Dispositivo */}
              <div style={{ flex: 1, background: '#090d16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {scannerSource === 'camera' && !scannedImage && (
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <video id="scanner-video" autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {/* Animación de Haz Láser */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(to bottom, transparent, #a855f7, transparent)', boxShadow: '0 0 12px #a855f7', animation: 'scan-laser 2s linear infinite' }} />
                    {/* Botón de Captura */}
                    <button
                      type="button"
                      onClick={captureCameraFrame}
                      style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', background: '#a855f7', border: 'none', width: '56px', height: '56px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(168,85,247,0.5)' }}
                      title="Capturar Fotografía"
                    >
                      <Camera size={24} color="#fff" />
                    </button>
                  </div>
                )}

                {scannerSource === 'twain' && !scannedImage && (
                  <div style={{ textAlign: 'center', padding: '40px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                    {isScanningAnim ? (
                      <>
                        <Activity size={48} className="pulse-glow" color="#a855f7" />
                        <span style={{ fontSize: '13px', color: '#fff' }}>Alimentando hojas Fujitsu ScanSnap... {scanProgress}%</span>
                        <div style={{ width: '200px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${scanProgress}%`, height: '100%', background: '#a855f7', transition: 'width 0.2s' }} />
                        </div>
                      </>
                    ) : (
                      <>
                        <Layers size={48} color="#475569" />
                        <span style={{ fontSize: '13px', color: '#8f9cae' }}>Alimentador Automático de Hojas Vacío</span>
                        <button
                          type="button"
                          onClick={startTwainScan}
                          className="btn-primary"
                          style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          🟢 Iniciar Escaneo Fujitsu TWAIN
                        </button>
                      </>
                    )}
                  </div>
                )}

                {scannedImage && (
                  <div style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <img src={scannedImage} alt="Documento Escaneado" style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <button
                      type="button"
                      onClick={() => {
                        setScannedImage(null);
                        if (scannerSource === 'camera') startCameraScan();
                      }}
                      style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', color: '#f87171', padding: '6px 12px', fontSize: '11px', cursor: 'pointer' }}
                    >
                      🗑️ Re-escanear
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Lado Derecho: Metadatos y Catálogo */}
            <form onSubmit={handleScanUpload} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#8f9cae', textTransform: 'uppercase' }}>Indexación DMS & Relaciones</span>
                <button
                  type="button"
                  onClick={() => {
                    stopCameraScan();
                    setShowScannerModal(false);
                    setScannedImage(null);
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X size={20} color="#8f9cae" />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: '#cbd5e1' }}>Nombre del Archivo Digitalizado:</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Contrato_Estudiante.pdf"
                  value={scannedFileName}
                  onChange={(e) => setScannedFileName(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Outfit' }}
                />
              </div>

              {/* Indexación Lógica */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: '#cbd5e1' }}>Indexación Lógica (Rama Académica):</label>
                <select
                  value={scannedLogicalNodeId}
                  onChange={(e) => setScannedLogicalNodeId(e.target.value)}
                  style={{ background: '#121624', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '13px', outline: 'none' }}
                >
                  <option value="">-- No vincular a estructura lógica --</option>
                  {getDestinosElegibles(treeData, false).map(n => (
                    <option key={`scan-log-${n.id}`} value={n.id}>{n.codigo} - {n.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Indexación Física */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: '#cbd5e1' }}>Indexación Física (Caja / Estante):</label>
                <select
                  value={scannedPhysicalNodeId}
                  onChange={(e) => setScannedPhysicalNodeId(e.target.value)}
                  style={{ background: '#121624', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '13px', outline: 'none' }}
                >
                  <option value="">-- No vincular a estructura física --</option>
                  {getDestinosElegibles(treeData, true).map(n => (
                    <option key={`scan-phys-${n.id}`} value={n.id}>{n.codigo} - {n.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Persona Relacionada en Caliente */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }}>
                <label style={{ fontSize: '11px', color: '#cbd5e1' }}>Vincular Persona Principal/Secundaria:</label>
                <input 
                  type="text" 
                  placeholder="Buscar estudiante o docente..."
                  value={scannedLinkPersonaQuery}
                  onChange={(e) => setScannedLinkPersonaQuery(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Outfit' }}
                />
                
                {scannedLinkPersonaSearchResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '60px', left: 0, right: 0, background: '#101424', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '8px', zIndex: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {scannedLinkPersonaSearchResults.map(p => {
                      const rNombre = p.rol_actual ? p.rol_actual.nombre : 'Sin Rol';
                      return (
                        <div 
                          key={`scan-per-match-${p.id}`}
                          onClick={() => {
                            setScannedLinkPersona(p);
                            setScannedLinkPersonaRolMomentoId(p.rol_actual_id || '');
                            setScannedLinkPersonaQuery(p.nombre_completo);
                            setScannedLinkPersonaSearchResults([]);
                          }}
                          style={{ padding: '8px 12px', color: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                          className="hover-glow"
                        >
                          <span>👤 {p.nombre_completo}</span>
                          <span style={{ fontSize: '10px', color: '#8f9cae' }}>{rNombre}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {scannedLinkPersona && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'rgba(168, 85, 247, 0.03)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '8px', marginTop: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#c084fc', fontWeight: 600 }}>Miembro: {scannedLinkPersona.nombre_completo}</span>
                    <button type="button" onClick={() => setScannedLinkPersona(null)} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '10px', cursor: 'pointer' }}>Remover</button>
                  </div>
                  
                  {/* SELECT DROPDOWN DE ROL DEL MOMENTO (ESCÁNER) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#cbd5e1' }}>Rol en el Momento de Escanear:</span>
                    <select
                      value={scannedLinkPersonaRolMomentoId}
                      onChange={(e) => setScannedLinkPersonaRolMomentoId(e.target.value)}
                      style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '11px', outline: 'none' }}
                    >
                      <option value="">-- Usar rol actual por defecto --</option>
                      {rolesOrganizacion.map(rol => (
                        <option key={`scan-mom-rol-${rol.id}`} value={rol.id}>{rol.nombre} ({rol.codigo})</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#8f9cae' }}>Relación:</span>
                      <input 
                        type="text" 
                        value={scannedLinkPersonaRelacion} 
                        onChange={(e) => setScannedLinkPersonaRelacion(e.target.value)} 
                        style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '11px', outline: 'none' }}
                      />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#8f9cae' }}>Peso (1-10):</span>
                      <select 
                        value={scannedLinkPersonaPeso} 
                        onChange={(e) => setScannedLinkPersonaPeso(e.target.value)} 
                        style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '11px', outline: 'none' }}
                      >
                        {[1,2,3,4,5,6,7,8,9,10].map(w => (
                          <option key={`scan-w-${w}`} value={w}>P{w} {w === 1 ? '(Alta)' : w === 10 ? '(Baja)' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Botón de Carga Final */}
              <button
                type="submit"
                disabled={!scannedImage}
                className="btn-primary"
                style={{ padding: '14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: scannedImage ? 1 : 0.5 }}
              >
                <FolderPlus size={16} /> Registrar y Catalogar en DMS
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GUARDAR CONFIGURACIÓN DE VISTA */}
      {showSaveVistaModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11600 }}>
          <form 
            onSubmit={handleSaveVista}
            style={{ 
              background: '#0a0e1a', 
              border: '1px solid rgba(168, 85, 247, 0.4)', 
              boxShadow: '0 0 30px rgba(168, 85, 247, 0.2)', 
              borderRadius: '16px', 
              padding: '24px', 
              width: '380px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                background: 'rgba(168, 85, 247, 0.1)', 
                width: '36px', 
                height: '36px', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <span style={{ fontSize: '18px' }}>💾</span>
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                Guardar Configuración de Vista
              </h3>
            </div>

            <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
              Guarda el estado actual de expansión y colapso de las carpetas. Si el nombre ya existe, se sobrescribirá.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>Nombre de la Vista:</label>
              <input 
                type="text" 
                required
                placeholder="Ej. Sistemas, Electrónica, Auditoría..."
                value={newVistaName}
                onChange={(e) => setNewVistaName(e.target.value)}
                style={{ 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid rgba(255,255,255,0.08)', 
                  borderRadius: '8px', 
                  padding: '10px 12px', 
                  color: '#fff', 
                  fontSize: '13px', 
                  outline: 'none', 
                  fontFamily: 'Outfit' 
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button 
                type="button"
                onClick={() => {
                  setShowSaveVistaModal(false);
                  setNewVistaName('');
                }}
                style={{ 
                  flex: 1, 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.08)', 
                  borderRadius: '8px', 
                  color: '#fff', 
                  padding: '10px', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                Cancelar
              </button>
              <button 
                type="submit"
                style={{ 
                  flex: 1, 
                  background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', 
                  border: 'none', 
                  borderRadius: '8px', 
                  color: '#fff', 
                  padding: '10px', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)' 
                }}
              >
                Guardar Vista
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL CONFIGURACIÓN DE ROLES ORGANIZACIONALES (Archi-vite) */}
      {showRolesConfigModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11500 }}>
          <div 
            className="glass-panel" 
            style={{ 
              width: '800px', 
              padding: '30px', 
              borderRadius: '16px', 
              border: '1px solid rgba(168, 85, 247, 0.4)', 
              boxShadow: '0 0 25px rgba(168, 85, 247, 0.15)',
              display: 'flex',
              gap: '24px'
            }}
          >
            {/* Lado Izquierdo: Lista de Roles actuales */}
            <div style={{ flex: 1.2, borderRight: '1px solid rgba(255,255,255,0.06)', paddingRight: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Settings size={18} color="#a855f7" /> Roles de Organización Activos
                </h3>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', maxHeight: '350px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#cbd5e1', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
                      <th style={{ padding: '8px 12px' }}>Código</th>
                      <th style={{ padding: '8px 12px' }}>Rol</th>
                      <th style={{ padding: '8px 12px' }}>Previsualización</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Eliminar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rolesOrganizacion.map(rol => (
                      <tr key={`tbl-rol-${rol.id}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 600, color: '#c084fc' }}>{rol.codigo}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#fff' }}>{rol.nombre}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ color: rol.color, background: `${rol.color}15`, padding: '3px 8px', borderRadius: '4px', border: `1px solid ${rol.color}33`, fontSize: '10px', textTransform: 'uppercase', fontWeight: 600 }}>
                            {rol.nombre}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteRolOrganizacion(rol.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            title="Eliminar Rol de la base de datos"
                          >
                            <Trash2 size={13} color="#f87171" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Lado Derecho: Formulario para añadir uno nuevo */}
            <form onSubmit={handleCreateRolOrganizacion} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#8f9cae', textTransform: 'uppercase' }}>Crear Rol Comercial</span>
                <button
                  type="button"
                  onClick={() => setShowRolesConfigModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X size={18} color="#8f9cae" />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: '#cbd5e1' }}>Nombre del Rol:</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Gerente de Proyecto"
                  value={newRolNombre}
                  onChange={(e) => setNewRolNombre(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Outfit' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: '#cbd5e1' }}>Código Corto (Abreviado):</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. GER, MED, AUD"
                  value={newRolCodigo}
                  onChange={(e) => setNewRolCodigo(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Outfit' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: '#cbd5e1' }}>Color Neón Distintivo:</label>
                <select
                  value={newRolColor}
                  onChange={(e) => setNewRolColor(e.target.value)}
                  style={{ background: '#121624', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="#3b82f6">🔵 Azul Celeste</option>
                  <option value="#10b981">🟢 Verde Esmeralda</option>
                  <option value="#f59e0b">🟡 Amarillo Ámbar</option>
                  <option value="#ec4899">🔴 Fucsia Neón</option>
                  <option value="#a855f7">🟣 Púrpura Archi-vite</option>
                  <option value="#06b6d4">🌐 Turquesa Cyan</option>
                  <option value="#f43f5e">🌹 Rosa Carmín</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Plus size={14} /> Registrar Rol en Catálogo
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Flotante Neón Homogeneizado */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 12000,
          background: 'var(--bg-color-panel)',
          backdropFilter: 'blur(20px)',
          border: notification.tipo === 'error' ? '1px solid #ef4444' : '1px solid var(--primary-glow)',
          borderRadius: '10px',
          padding: '16px 20px',
          boxShadow: notification.tipo === 'error' ? '0 0 25px rgba(239, 68, 68, 0.25)' : '0 0 20px var(--glow-shadow-intensity)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          width: '280px',
          transition: 'all 0.3s ease'
        }}>
          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: notification.tipo === 'error' ? '#f87171' : 'var(--primary-glow)' }}>{notification.title}</h4>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-color-muted)' }}>{notification.message}</p>
        </div>
      )}

      {/* Inputs File Invisibles */}
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple={true} style={{ display: 'none' }} />
      <input type="file" ref={nodeSpecificUploadRef} onChange={handleNodeSpecificUpload} multiple={true} style={{ display: 'none' }} />

    </div>
  );
}
