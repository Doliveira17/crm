'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useContatosList } from '@/lib/hooks/useContatos'
import { SearchInput } from '@/components/common/SearchInput'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, UserCircle } from 'lucide-react'
import { formatPhoneBR } from '@/lib/utils/normalize'
import { formatDate } from '@/lib/utils/format'

export default function ContatosPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const { data: contatos, isLoading } = useContatosList(searchTerm)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contatos</h1>
          <p className="text-muted-foreground">Gerenciar cadastro de contatos</p>
        </div>
        <Link href="/contatos/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Contato
          </Button>
        </Link>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por nome, celular, e-mail ou cargo..."
          />
        </div>

        {isLoading ? (
          <LoadingState />
        ) : !contatos || contatos.length === 0 ? (
          <EmptyState
            icon={<UserCircle className="h-12 w-12" />}
            title="Nenhum contato encontrado"
            description={
              searchTerm
                ? 'Tente ajustar os termos da sua busca'
                : 'Comece criando seu primeiro contato'
            }
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Celular</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Atualizado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contatos.map((contato) => (
                  <TableRow
                    key={contato.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/contatos/${contato.id}`)}
                  >
                    <TableCell className="font-medium">
                      {contato.nome_completo}
                    </TableCell>
                    <TableCell>{contato.cargo}</TableCell>
                    <TableCell>{formatPhoneBR(contato.celular)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {contato.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(contato.updated_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
