import { useRef, useState } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import { validatePhotoFile } from '../../shared/utils/fileValidators'

interface PhotoUploadFieldProps {
  label: string
  onFileSelected: (file: File | null) => void
}

// Composant d'upload avec aperçu avant envoi. L'upload réel vers Supabase
// Storage se fait via photosService.uploadModelPhoto() au moment de la
// soumission finale du formulaire (voir ModelForm.tsx).
export function PhotoUploadField({ label, onFileSelected }: PhotoUploadFieldProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validatePhotoFile(file)
    if (validationError) {
      setError(validationError)
      onFileSelected(null)
      return
    }

    setError(null)
    setPreview(URL.createObjectURL(file))
    onFileSelected(file)
  }

  function handleClear() {
    setPreview(null)
    setError(null)
    onFileSelected(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative flex aspect-square w-full max-w-[180px] items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
        {preview ? (
          <>
            <img src={preview} alt={label} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-1 top-1 rounded-full bg-white p-1 shadow"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <ImageIcon size={28} />
            <span className="text-xs">Ajouter</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          className="hidden"
        />
      </div>
      {!preview && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 flex items-center gap-1 text-xs text-yms-600"
        >
          <Upload size={12} /> Choisir un fichier
        </button>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
