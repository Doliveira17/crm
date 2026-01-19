'use client'

import { useState, useMemo } from 'react'
import { useRelatoriosList } from '@/lib/hooks/useRelatorios'
import { LoadingState } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/common/EmptyState'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  FileText, 
  ExternalLink, 
  Eye, 
  Video, 
  FileImage, 
  Phone, 
  Briefcase, 
  User, 
  Calendar,
  Search,
  Building2,
  Play,
  FileDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils/format'

export default function RelatoriosPage() {
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false)
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: relatorios, isLoading } = useRelatoriosList()

  const handleViewVideo = (url: string) => {
    setSelectedVideo(url)
    setVideoDialogOpen(true)
  }

  const handleViewPdf = (url: string) => {
    setSelectedPdf(url)
    setPdfDialogOpen(true)
  }

  // Filtrar relatórios baseado na busca
  const filteredRelatorios = useMemo(() => {
    if (!relatorios) return []
    if (!searchQuery.trim()) return relatorios

    const query = searchQuery.toLowerCase()
    return relatorios.filter((r) => {
      const clienteNome = r.cliente?.nome_cadastro?.toLowerCase() || ''
      const contatoNome = r.contato?.nome_completo?.toLowerCase() || ''
      const celular = r.contato?.celular || ''
      const plantId = r.plant_id?.toLowerCase() || ''
      
      return (
        clienteNome.includes(query) ||
        contatoNome.includes(query) ||
        celular.includes(query) ||
        plantId.includes(query)
      )
    })
  }, [relatorios, searchQuery])

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'enviado':
        return <CheckCircle2 className="h-4 w-4" />
      case 'erro':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'enviado':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      case 'erro':
        return 'bg-red-500/10 text-red-600 border-red-500/20'
      default:
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header com título e barra de pesquisa integrada */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            {filteredRelatorios.length} {filteredRelatorios.length === 1 ? 'relatório' : 'relatórios'} encontrados
          </p>
        </div>

        {/* Barra de pesquisa compacta e elegante */}
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar cliente, contato..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-11 bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Lista de relatórios */}
      {isLoading ? (
        <LoadingState />
      ) : !filteredRelatorios || filteredRelatorios.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title={searchQuery ? "Nenhum resultado encontrado" : "Nenhum relatório encontrado"}
          description={searchQuery ? `Não há resultados para "${searchQuery}"` : "Não há relatórios cadastrados no sistema"}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRelatorios.map((relatorio) => (
            <Card 
              key={relatorio.id} 
              className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-card"
            >
              <div className="p-5">
                {/* Header com cliente e status */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h3 className="font-semibold text-base leading-tight line-clamp-2 flex-1">
                    {relatorio.cliente?.nome_cadastro || 'Cliente não informado'}
                  </h3>
                  <Badge 
                    variant="outline"
                    className={`shrink-0 text-xs ${getStatusColor(relatorio.status_envio)}`}
                  >
                    {getStatusIcon(relatorio.status_envio)}
                    <span className="ml-1 capitalize">{relatorio.status_envio || 'Pendente'}</span>
                  </Badge>
                </div>

                {/* Informações do contato em linha */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-4">
                  {relatorio.contato?.nome_completo && (
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      <span>{relatorio.contato.nome_completo}</span>
                    </div>
                  )}
                  
                  {relatorio.contato?.celular && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{relatorio.contato.celular}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDateTime(relatorio.created_at)}</span>
                  </div>

                  {relatorio.viewed && (
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <Eye className="h-3.5 w-3.5" />
                      <span>Visualizado</span>
                    </div>
                  )}
                </div>

                {/* Botões de ação */}
                <div className="flex gap-2">
                  {relatorio.url && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleViewVideo(relatorio.url!)}
                      className="flex-1 h-9"
                    >
                      <Play className="h-4 w-4 mr-1.5" />
                      Vídeo
                    </Button>
                  )}
                  {relatorio.url_pdf && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPdf(relatorio.url_pdf!)}
                      className="flex-1 h-9"
                    >
                      <FileDown className="h-4 w-4 mr-1.5" />
                      PDF
                    </Button>
                  )}
                  {!relatorio.url && !relatorio.url_pdf && (
                    <div className="flex-1 text-center text-xs text-muted-foreground py-2 bg-muted/50 rounded-md">
                      Sem mídia
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para visualizar vídeo */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="max-w-5xl p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Visualização do Vídeo
            </DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video w-full bg-black">
            {selectedVideo && (
              <video
                controls
                autoPlay
                className="h-full w-full"
                src={selectedVideo}
              >
                Seu navegador não suporta a tag de vídeo.
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar PDF */}
      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5 text-primary" />
              Visualização do PDF
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {selectedPdf && (
              <iframe
                src={selectedPdf}
                className="w-full h-full border-0"
                title="PDF Preview"
              />
            )}
          </div>
          <div className="p-4 border-t bg-muted/50">
            <a
              href={selectedPdf || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button size="sm" variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir em Nova Aba
              </Button>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
