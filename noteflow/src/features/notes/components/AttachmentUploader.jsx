import { useEffect, useRef, useState } from 'react'
import { Paperclip, X, Loader2 } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { uploadAttachment, deleteAttachment } from '../api'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

export function AttachmentUploader({ noteId, attachments = [], onAttachmentsChange }) {
  const { user } = useAuth()
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [urls, setUrls] = useState({})
  const [previewing, setPreviewing] = useState(null)

  const getUrl = async (att) => {
    if (urls[att.id]) return urls[att.id]
    const { data } = await supabase.storage.from('note-attachments').createSignedUrl(att.storage_path, 3600)
    if (data?.signedUrl) setUrls(u => ({ ...u, [att.id]: data.signedUrl }))
    return data?.signedUrl
  }

  const handleFiles = async (files) => {
    setUploading(true)
    for (const file of files) {
      try {
        let toUpload = file
        if (file.type.startsWith('image/')) {
          toUpload = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920 })
        }
        const att = await uploadAttachment(noteId, user.id, toUpload)
        onAttachmentsChange?.([...attachments, att])
      } catch (e) {
        toast.error('Upload failed: ' + e.message)
      }
    }
    setUploading(false)
  }

  const handleRemove = async (att) => {
    try {
      await deleteAttachment(att)
      onAttachmentsChange?.(attachments.filter(a => a.id !== att.id))
    } catch {
      toast.error('Failed to remove attachment')
    }
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {attachments.map(att => (
            <div key={att.id} className="relative group rounded-md overflow-hidden" style={{ width: 80, height: 80 }}>
              <button
                type="button"
                onClick={async () => {
                  const src = await getUrl(att)
                  if (src) setPreviewing({ ...att, src })
                }}
                className="block w-full h-full"
                title="Preview attachment"
              >
                <ImageThumb att={att} getUrl={getUrl} />
              </button>
              <button
                type="button"
                onClick={() => handleRemove(att)}
                className="absolute top-1 right-1 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-20 h-20 rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors hover:bg-muted"
            style={{ borderColor: 'var(--border-strong)' }}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--text-muted)' }} /> : <Paperclip className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />}
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Add</span>
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={e => handleFiles(Array.from(e.target.files))}
        />
      </div>

      <Dialog open={!!previewing} onOpenChange={(open) => !open && setPreviewing(null)}>
        <DialogContent className="max-w-4xl p-3 sm:p-4">
          <DialogTitle className="pr-8 text-sm sm:text-base">
            {previewing?.file_name || 'Attachment preview'}
          </DialogTitle>
          {previewing?.src ? (
            <img
              src={previewing.src}
              alt={previewing.file_name}
              className="mt-3 max-h-[75vh] w-full rounded-md object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

function ImageThumb({ att, getUrl }) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    let active = true
    getUrl(att).then((url) => {
      if (active) setSrc(url)
    })
    return () => {
      active = false
    }
  }, [att, getUrl])

  return src
    ? <img src={src} alt={att.file_name} className="w-full h-full object-cover" />
    : <div className="w-full h-full" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
}
