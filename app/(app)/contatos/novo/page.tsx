'use client'

import { useRouter } from 'next/navigation'
import { useCreateContato } from '@/lib/hooks/useContatos'
import { ContatoForm } from '@/components/contatos/ContatoForm'
import { ContatoFormData } from '@/lib/validators/contato'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NovoContatoPage() {
  const router = useRouter()
  const createContato = useCreateContato()

  const handleSubmit = async (data: ContatoFormData) => {
    await createContato.mutateAsync(data)
    router.push('/contatos')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/contatos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Novo Contato</h1>
          <p className="text-muted-foreground">Cadastrar um novo contato no sistema</p>
        </div>
      </div>

      <ContatoForm
        onSubmit={handleSubmit}
        onCancel={() => router.push('/contatos')}
        loading={createContato.isPending}
      />
    </div>
  )
}
