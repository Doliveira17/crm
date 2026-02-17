'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useClientesList } from '@/lib/hooks/useClientes'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { SearchInput } from '@/components/common/SearchInput'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, Users, Star, Save, ChevronLeft, ChevronRight, AlertCircle, 
  Filter, MoreHorizontal, Eye, Edit, Phone, Mail, Calendar, 
  TrendingUp, UserCheck, Building2, Grid3X3, List,
  BarChart3, Activity, Crown, ShieldAlert, User, X, Settings2, 
  Tag, Building, Heart, Clock
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { formatPhoneBR, formatDocument } from '@/lib/utils/normalize'
import { formatDate } from '@/lib/utils/format'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function ClientesPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 400)
  const [page, setPage] = useState(0)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const pageSize = 30
  
  // Estados dos filtros avançados
  const [filters, setFilters] = useState({
    status: [] as string[],
    tipo: [] as string[],
    favorito: null as boolean | null,
    temTags: null as boolean | null,
    temGrupoEconomico: null as boolean | null,
    temWhatsapp: null as boolean | null,
  })
  
  const { data, isLoading } = useClientesList(debouncedSearch, page, pageSize)
  
  const clientes = data?.clientes || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / pageSize)
  
  // Resetar página ao buscar
  useEffect(() => {
    setPage(0)
  }, [searchTerm])
  
  // Estado do auto-save global
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('global-auto-save') === 'true'
    }
    return false
  })

  // Persistir configuração do auto-save global
  const toggleAutoSave = () => {
    const newValue = !autoSaveEnabled
    setAutoSaveEnabled(newValue)
    localStorage.setItem('global-auto-save', String(newValue))
    toast.success(`Auto-save ${newValue ? 'ativado' : 'desativado'} para todos os formulários`)
  }

  // Filtrar clientes com base nos filtros avançados
	  const filteredClientes = clientes.filter(cliente => {
	    // Filtro por status
	    if (filters.status.length > 0 && !filters.status.includes(cliente.status || '')) return false
	    
	    // Filtro por tipo
	    if (filters.tipo.length > 0 && !filters.tipo.includes(cliente.tipo_cliente || '')) return false
    
    // Filtro por favorito
    if (filters.favorito !== null && cliente.favorito !== filters.favorito) return false
    
    // Filtro por tags
    if (filters.temTags === true && (!cliente.tags || cliente.tags.length === 0)) return false
    if (filters.temTags === false && cliente.tags && cliente.tags.length > 0) return false
    
    // Filtro por grupo econômico
	    if (filters.temGrupoEconomico === true && !(cliente as any).grupo_economico_nome) return false
	    if (filters.temGrupoEconomico === false && (cliente as any).grupo_economico_nome) return false
	    
	    // Filtro por WhatsApp
	    const grupoWhatsapp = (cliente as any).grupo_whatsapp as string | null | undefined
	    if (filters.temWhatsapp === true && !grupoWhatsapp) return false
	    if (filters.temWhatsapp === false && grupoWhatsapp) return false
	    
	    return true
	  })

  // Verificar se há filtros ativos
  const hasActiveFilters = 
    filters.status.length > 0 ||
    filters.tipo.length > 0 ||
    filters.favorito !== null ||
    filters.temTags !== null ||
    filters.temGrupoEconomico !== null ||
    filters.temWhatsapp !== null

  // Limpar todos os filtros
  const clearAllFilters = () => {
    setFilters({
      status: [],
      tipo: [],
      favorito: null,
      temTags: null,
      temGrupoEconomico: null,
      temWhatsapp: null,
    })
  }

  // Toggle do filtro de status
  const toggleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }))
  }

  // Toggle do filtro de tipo
  const toggleTipoFilter = (tipo: string) => {
    setFilters(prev => ({
      ...prev,
      tipo: prev.tipo.includes(tipo)
        ? prev.tipo.filter(t => t !== tipo)
        : [...prev.tipo, tipo]
    }))
  }

	  // Função para obter cor do status (tons sobrios)
	  const getStatusColor = (status: string | null) => {
	    switch (status || '') {
	      case 'ATIVO': return 'bg-gray-100 text-gray-700 border-gray-300'
	      case 'INATIVO': return 'bg-gray-50 text-gray-600 border-gray-200'
	      case 'PROSPECTO': return 'bg-slate-100 text-slate-700 border-slate-300'
	      case 'SUSPENSO': return 'bg-stone-100 text-stone-700 border-stone-300'
	      case 'BLOQUEADO': return 'bg-red-50 text-red-700 border-red-200'
	      default: return 'bg-gray-50 text-gray-600 border-gray-200'
	    }
	  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho limpo e sóbrio */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Clientes
          </h1>
          <p className="text-muted-foreground">Gerenciar cadastro de clientes</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={autoSaveEnabled ? "default" : "outline"}
            size="sm"
            onClick={toggleAutoSave}
            title={`Auto-save global ${autoSaveEnabled ? 'ativado' : 'desativado'}`}
          >
            <Save className="mr-2 h-4 w-4" />
            Auto-save {autoSaveEnabled ? 'ON' : 'OFF'}
          </Button>
          <Link href="/clientes/novo">
            <Button className="bg-black hover:bg-gray-800 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border border-gray-200">
        <CardHeader className="bg-gray-50/50 border-b">
          <div className="space-y-4">
            {/* Barra de busca */}
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por nome, documento, telefone, e-mail ou grupo WhatsApp..."
            />
            
            {/* Sistema de filtros avançados */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Filtros avançados */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={`gap-2 ${hasActiveFilters ? 'bg-gray-50 border-gray-400' : ''}`}
                    >
                      <Settings2 className="h-4 w-4" />
                      Filtros
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs ml-1">
                          {[
                            filters.status.length > 0 ? filters.status.length : 0,
                            filters.tipo.length > 0 ? filters.tipo.length : 0,
                            filters.favorito !== null ? 1 : 0,
                            filters.temTags !== null ? 1 : 0,
                            filters.temGrupoEconomico !== null ? 1 : 0,
                            filters.temWhatsapp !== null ? 1 : 0
                          ].reduce((acc, curr) => acc + curr, 0)}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 p-4 space-y-4" align="start">
                    {/* Cabeçalho */}
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">Filtros Avançados</h4>
                      {hasActiveFilters && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={clearAllFilters}
                          className="h-8 px-3 text-xs"
                        >
                          Limpar
                        </Button>
                      )}
                    </div>
                    
                    <Separator />
                    
                    {/* Status */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Status
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {['ATIVO', 'INATIVO', 'PROSPECTO', 'SUSPENSO', 'BLOQUEADO'].map(status => (
                          <label key={status} className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={filters.status.includes(status)}
                              onCheckedChange={() => toggleStatusFilter(status)}
                            />
                            <span className="text-sm">{status}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Tipo */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Tipo de Cliente
                      </Label>
                      <div className="flex gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <Checkbox
                            checked={filters.tipo.includes('PF')}
                            onCheckedChange={() => toggleTipoFilter('PF')}
                          />
                          <span className="text-sm">Pessoa Física</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <Checkbox
                            checked={filters.tipo.includes('PJ')}
                            onCheckedChange={() => toggleTipoFilter('PJ')}
                          />
                          <span className="text-sm">Pessoa Jurídica</span>
                        </label>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Características especiais */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Características</Label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <Checkbox
                            checked={filters.favorito === true}
                            onCheckedChange={(checked) => 
                              setFilters(prev => ({ ...prev, favorito: checked ? true : null }))
                            }
                          />
                          <Heart className="h-3 w-3" />
                          <span className="text-sm">Favoritos</span>
                        </label>
                        
                        <div className="space-y-2">
                          <Select 
                            value={filters.temTags === null ? 'all' : filters.temTags ? 'yes' : 'no'} 
                            onValueChange={(value) => 
                              setFilters(prev => ({ 
                                ...prev, 
                                temTags: value === 'all' ? null : value === 'yes' 
                              }))
                            }
                          >
                            <SelectTrigger className="h-8">
                              <div className="flex items-center gap-2 text-sm">
                                <Tag className="h-3 w-3" />
                                <SelectValue placeholder="Com/Sem Tags" />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas as tags</SelectItem>
                              <SelectItem value="yes">Com Tags</SelectItem>
                              <SelectItem value="no">Sem Tags</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Select 
                            value={filters.temGrupoEconomico === null ? 'all' : filters.temGrupoEconomico ? 'yes' : 'no'} 
                            onValueChange={(value) => 
                              setFilters(prev => ({ 
                                ...prev, 
                                temGrupoEconomico: value === 'all' ? null : value === 'yes' 
                              }))
                            }
                          >
                            <SelectTrigger className="h-8">
                              <div className="flex items-center gap-2 text-sm">
                                <Building2 className="h-3 w-3" />
                                <SelectValue placeholder="Grupo Econômico" />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos os grupos</SelectItem>
                              <SelectItem value="yes">Com Grupo</SelectItem>
                              <SelectItem value="no">Sem Grupo</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Select 
                            value={filters.temWhatsapp === null ? 'all' : filters.temWhatsapp ? 'yes' : 'no'} 
                            onValueChange={(value) => 
                              setFilters(prev => ({ 
                                ...prev, 
                                temWhatsapp: value === 'all' ? null : value === 'yes' 
                              }))
                            }
                          >
                            <SelectTrigger className="h-8">
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3" />
                                <SelectValue placeholder="Grupo WhatsApp" />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos os grupos</SelectItem>
                              <SelectItem value="yes">Com WhatsApp</SelectItem>
                              <SelectItem value="no">Sem WhatsApp</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Chips de filtros ativos */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-1">
                    {filters.status.map(status => (
                      <Badge key={status} variant="secondary" className="gap-1 pr-1">
                        Status: {status}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => toggleStatusFilter(status)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                    {filters.tipo.map(tipo => (
                      <Badge key={tipo} variant="secondary" className="gap-1 pr-1">
                        {tipo}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => toggleTipoFilter(tipo)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                    {filters.favorito === true && (
                      <Badge variant="secondary" className="gap-1 pr-1">
                        <Heart className="h-3 w-3" /> Favoritos
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => setFilters(prev => ({ ...prev, favorito: null }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                    {filters.temTags !== null && (
                      <Badge variant="secondary" className="gap-1 pr-1">
                        <Tag className="h-3 w-3" /> {filters.temTags ? 'Com Tags' : 'Sem Tags'}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => setFilters(prev => ({ ...prev, temTags: null }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">

        {isLoading ? (
          <div className="p-8">
            <LoadingState />
          </div>
        ) : !filteredClientes || filteredClientes.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="Nenhum cliente encontrado"
              description={
                searchTerm || hasActiveFilters
                  ? 'Tente ajustar os filtros ou termos da sua busca'
                  : 'Comece criando seu primeiro cliente'
              }
            />
          </div>
        ) : viewMode === 'grid' ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredClientes.map((cliente) => (
                <Card 
                  key={cliente.id} 
                  className="group cursor-pointer hover:shadow-md transition-all duration-200 bg-white border-gray-200 hover:border-gray-300"
                  onClick={() => router.push(`/clientes/${cliente.id}`)}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Cabeçalho do card */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {cliente.tipo_cliente === 'PJ' ? (
                          <Building2 className="h-5 w-5 text-gray-600" />
                        ) : (
                          <User className="h-5 w-5 text-gray-500" />
                        )}
                        {cliente.favorito && (
                          <Star className="h-4 w-4 fill-gray-400 text-gray-400" />
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/clientes/${cliente.id}`) }}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/clientes/${cliente.id}`) }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {/* Nome e status */}
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate group-hover:text-gray-700 transition-colors">
                        {cliente.razao_social}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-2 py-0.5 ${getStatusColor(cliente.status)}`}
                        >
                          {cliente.status}
                        </Badge>
                        {cliente.tipo_cliente && (
                          <Badge variant="secondary" className="text-xs">
                            {cliente.tipo_cliente}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Informações de contato */}
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {cliente.documento && (
                        <div className="flex items-center gap-2">
                          <span className="w-16 text-xs font-medium">Doc:</span>
                          <span className="font-mono text-xs">{formatDocument(cliente.documento)}</span>
                        </div>
                      )}
                      {cliente.telefone_principal && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span className="text-xs">{formatPhoneBR(cliente.telefone_principal)}</span>
                        </div>
                      )}
                      {cliente.email_principal && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span className="text-xs truncate">{cliente.email_principal}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Tags */}
                    {cliente.tags && cliente.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {cliente.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">
                            {tag}
                          </Badge>
                        ))}
                        {cliente.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            +{cliente.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {/* Rodapé */}
                    <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(cliente.updated_at)}
                      </div>
                      {(cliente as any).grupo_economico_nome && (
                        <Badge variant="outline" className="text-xs">
                          {(cliente as any).grupo_economico_nome}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="font-semibold">Cliente</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="font-semibold">Documento</TableHead>
                  <TableHead className="font-semibold">Contato</TableHead>
                  <TableHead className="font-semibold">Tags</TableHead>
                  <TableHead className="font-semibold">Atualizado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.map((cliente) => (
                  <TableRow
                    key={cliente.id}
                    className="group cursor-pointer hover:bg-blue-50/50 transition-colors"
                    onClick={() => router.push(`/clientes/${cliente.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {cliente.tipo_cliente === 'PJ' ? (
                          <Building2 className="h-4 w-4 text-gray-600" />
                        ) : (
                          <User className="h-4 w-4 text-gray-500" />
                        )}
                        {cliente.favorito && (
                          <Star className="h-3 w-3 fill-gray-400 text-gray-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                          {cliente.razao_social}
                        </div>
                        {(cliente as any).grupo_economico_nome && (
                          <Badge variant="outline" className="text-xs">
                            {(cliente as any).grupo_economico_nome}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getStatusColor(cliente.status)}`}
                      >
                        {cliente.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {cliente.tipo_cliente && (
                        <Badge variant="secondary" className="text-xs">
                          {cliente.tipo_cliente}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {formatDocument(cliente.documento)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {cliente.telefone_principal && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span className="text-xs">{formatPhoneBR(cliente.telefone_principal)}</span>
                          </div>
                        )}
                        {cliente.email_principal && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="text-xs max-w-32 truncate">{cliente.email_principal}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {cliente.tags?.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {cliente.tags && cliente.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{cliente.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(cliente.updated_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/clientes/${cliente.id}`) }}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/clientes/${cliente.id}`) }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Paginação melhorada */}
            {total > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/30">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {hasActiveFilters || searchTerm ? (
                        <>Encontrados {filteredClientes.length} de {total} cliente{total !== 1 ? 's' : ''}</>
                      ) : (
                        <>Mostrando {page * 100 + 1} a {Math.min((page + 1) * 100, total)} de {total} cliente{total !== 1 ? 's' : ''}</>
                      )}
                    </span>
                  </div>
                  {(hasActiveFilters || searchTerm) && (
                    <Badge variant="secondary" className="text-xs">
                      <Filter className="h-3 w-3 mr-1" />
                      {searchTerm ? 'Busca + ' : ''}Filtros
                    </Badge>
                  )}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="hover:bg-gray-50"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium px-3 py-1 bg-gray-100 text-gray-700 rounded">
                        {page + 1}
                      </span>
                      <span className="text-sm text-muted-foreground">de {totalPages}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="hover:bg-gray-50"
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  )
}
