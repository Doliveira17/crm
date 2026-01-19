'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import { useAllTags } from '@/lib/hooks/useTags'

interface TagsSelectorProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
}

export function TagsSelector({ selectedTags, onChange }: TagsSelectorProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const { data: allTags } = useAllTags()

  const handleAddTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      onChange([...selectedTags, tag])
    }
    setInputValue('')
    setShowSuggestions(false)
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(selectedTags.filter(tag => tag !== tagToRemove))
  }

  // Mostra todas as tags existentes no sistema que não estão selecionadas
  const availableTags = allTags?.map(t => t.name) || []
  
  const filteredSuggestions = availableTags.filter(
    tag => 
      !selectedTags.includes(tag) && 
      tag.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map(tag => (
          <Badge 
            key={tag} 
            variant="secondary" 
            className="gap-1 pr-1"
          >
            {tag}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 rounded-full hover:bg-muted-foreground/20"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      <div className="relative">
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Buscar tags..."
          className="flex-1"
          readOnly={!allTags || allTags.length === 0}
        />

        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md border bg-card shadow-lg max-h-60 overflow-y-auto">
            {filteredSuggestions.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => handleAddTag(tag)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {showSuggestions && inputValue && filteredSuggestions.length === 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md border bg-card shadow-lg p-3">
            <p className="text-sm text-muted-foreground text-center">
              Nenhuma tag encontrada. Crie novas tags na seção Tags.
            </p>
          </div>
        )}

        {(!allTags || allTags.length === 0) && (
          <p className="text-xs text-muted-foreground mt-2">
            Nenhuma tag disponível. Crie tags na seção Tags primeiro.
          </p>
        )}
      </div>
    </div>
  )
}
