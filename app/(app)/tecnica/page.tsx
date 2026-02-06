'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTecnica } from '@/lib/hooks/useTecnica'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SearchInput } from '@/components/common/SearchInput'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/common/EmptyState'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Cpu, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { formatDocument } from '@/lib/utils/normalize'

// Função para normalizar texto removendo acentos
const normalizeText = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

// Função de busca avançada
const searchInTecnica = (tecnica: any, searchTerms: string[]): boolean => {
  // Criar array com todos os campos pesquisáveis
  const searchableFields = [
    tecnica.documento,
    formatDocument(tecnica.documento), // Documento formatado
    tecnica.razao_social,
    tecnica.nome_planta,
    tecnica.modalidade,
    tecnica.classificacao,
    tecnica.tipo_local,
    tecnica.marca_inverter,
    tecnica.mod_inverter,
    tecnica.serie_inverter,
    tecnica.marca_modulos,
    tecnica.mod_modulos,
    tecnica.potencia_usina_kwp?.toString(),
    tecnica.quant_inverter?.toString(),
    tecnica.quant_modulos?.toString(),
    tecnica.possui_internet ? 'sim' : 'não',
    tecnica.possui_internet ? 'internet' : 'sem internet',
  ]

  // Normalizar todos os campos
  const normalizedFields = searchableFields
    .filter(field => field != null && field !== '')
    .map(field => normalizeText(String(field)))

  // Cada termo de busca deve encontrar pelo menos um campo
  return searchTerms.every(term => 
    normalizedFields.some(field => field.includes(term))
  )
}

export default function TecnicaPage() {
  const router = useRouter()
  const { data: tecnicaList, isLoading, error } = useTecnica()
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [page, setPage] = useState(0)
  const itemsPerPage = 100

  useEffect(() => {
    if (!tecnicaList) return

    // Se não há busca, mostrar todos
    if (!searchTerm.trim()) {
      setFilteredData(tecnicaList)
      setPage(0)
      return
    }

    // Dividir o termo de busca em múltiplos termos (por espaço)
    const searchTerms = searchTerm
      .trim()
      .split(/\s+/)
      .map(term => normalizeText(term))
      .filter(term => term.length > 0)

    // Filtrar usando a busca avançada
    const filtered = tecnicaList.filter((tecnica: any) => 
      searchInTecnica(tecnica, searchTerms)
    )

    setFilteredData(filtered)
    setPage(0) // Resetar página ao buscar
  }, [searchTerm, tecnicaList])

  // Calcular dados paginados
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice(page * itemsPerPage, (page + 1) * itemsPerPage)
  const total = filteredData.length

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dados Técnicos</h1>
          <p className="text-muted-foreground">Editar dados técnicos dos clientes cadastrados</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por nome, documento, planta, modalidade, classificação, marcas, modelos..."
          />
        </div>

        {isLoading ? (
          <LoadingState />
        ) : !paginatedData || paginatedData.length === 0 ? (
          <EmptyState
            icon={<Cpu className="h-12 w-12" />}
            title="Nenhum dado técnico encontrado"
            description={
              searchTerm
                ? 'Tente ajustar os termos da sua busca'
                : 'Comece criando seu primeiro registro técnico'
            }
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Nome da Planta</TableHead>
                  <TableHead>Modalidade</TableHead>
                  <TableHead>Classificação</TableHead>
                  <TableHead>Potência (kWp)</TableHead>
                  <TableHead>Inversores</TableHead>
                  <TableHead>Painéis</TableHead>
                  <TableHead>Internet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((tecnica: any) => (
                  <TableRow
                    key={tecnica.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/tecnica/${tecnica.id}`)}
                  >
                    <TableCell className="font-medium">
                      {tecnica.razao_social || '—'}
                    </TableCell>
                    <TableCell>{formatDocument(tecnica.documento)}</TableCell>
                    <TableCell>{tecnica.nome_planta || '—'}</TableCell>
                    <TableCell>
                      {tecnica.modalidade ? (
                        <Badge variant="outline" className="text-xs">{tecnica.modalidade}</Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {tecnica.classificacao ? (
                        <Badge variant="secondary" className="text-xs">{tecnica.classificacao}</Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {tecnica.potencia_usina_kwp ? (
                        <span className="font-semibold text-gray-900">
                          {tecnica.potencia_usina_kwp} kWp
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {tecnica.quant_inverter ? `${tecnica.quant_inverter} un.` : '—'}
                    </TableCell>
                    <TableCell>
                      {tecnica.quant_modulos ? `${tecnica.quant_modulos} un.` : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tecnica.possui_internet ? 'default' : 'secondary'} className="text-xs">
                        {tecnica.possui_internet ? 'Sim' : 'Não'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Paginação */}
            {total > 0 && (
              <div className="flex items-center justify-between px-4 py-4 border-t bg-muted/30">
                <div className="text-sm text-muted-foreground">
                  Mostrando {page * itemsPerPage + 1} a {Math.min((page + 1) * itemsPerPage, total)} de {total} registro{total !== 1 ? 's' : ''}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <div className="text-sm font-medium">
                      Página {page + 1} de {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
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
      </Card>
    </div>
  )
}
