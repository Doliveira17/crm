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
import { Cpu, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatDocument } from '@/lib/utils/normalize'

export default function TecnicaPage() {
  const router = useRouter()
  const { data: tecnicaList, isLoading, error } = useTecnica()
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredData, setFilteredData] = useState<any[]>([])

  useEffect(() => {
    if (!tecnicaList) return

    const filtered = tecnicaList.filter((tecnica: any) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        (tecnica.documento?.toLowerCase().includes(searchLower)) ||
        (tecnica.razao_social?.toLowerCase().includes(searchLower)) ||
        (tecnica.nome_planta?.toLowerCase().includes(searchLower))
      )
    })

    setFilteredData(filtered)
  }, [searchTerm, tecnicaList])

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
            placeholder="Buscar por documento, razão social ou planta..."
          />
        </div>

        {isLoading ? (
          <LoadingState />
        ) : !filteredData || filteredData.length === 0 ? (
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
                  <TableHead>Razão Social</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Nome da Planta</TableHead>
                  <TableHead>Potência (kWp)</TableHead>
                  <TableHead>Modalidade</TableHead>
                  <TableHead>Classificação</TableHead>
                  <TableHead>Inversores</TableHead>
                  <TableHead>Painéis</TableHead>
                  <TableHead>Internet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((tecnica: any) => (
                  <TableRow
                    key={tecnica.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/tecnica/${tecnica.id}`)}
                  >
                    <TableCell className="font-medium">
                      {tecnica.razao_social || '—'}
                    </TableCell>
                    <TableCell>{formatDocument(tecnica.documento)}</TableCell>
                    <TableCell>{tecnica.nome_planta || '—'}</TableCell>
                    <TableCell>
                      {tecnica.potencia_usina_kwp ? (
                        <span className="font-semibold text-blue-600">
                          {tecnica.potencia_usina_kwp} kWp
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {tecnica.modalidade ? (
                        <Badge variant="outline">{tecnica.modalidade}</Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {tecnica.classificacao ? (
                        <Badge variant="secondary">{tecnica.classificacao}</Badge>
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
                      <Badge variant={tecnica.possui_internet ? 'default' : 'secondary'}>
                        {tecnica.possui_internet ? 'Sim' : 'Não'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Resumo */}
            {filteredData.length > 0 && (
              <div className="flex items-center justify-between px-4 py-4 border-t bg-muted/30">
                <div className="text-sm text-muted-foreground">
                  Mostrando <span className="font-semibold text-foreground">{filteredData.length}</span>{' '}
                  {filteredData.length === 1 ? 'registro' : 'registros'}
                  {tecnicaList && filteredData.length < tecnicaList.length && (
                    <>
                      {' '}de <span className="font-semibold text-foreground">{tecnicaList.length}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
