import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function AdminPanel() {
  const [notes, setNotes] = useState([])
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('school')
  const [subject, setSubject] = useState('')
  const [classOrExam, setClassOrExam] = useState('')
  const [description, setDescription] = useState('')
  const [pages, setPages] = useState('')
  const [price, setPrice] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchNotes()
  }, [])

  async function fetchNotes() {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setNotes(data)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) {
      setMessage('Please select a PDF file.')
      return
    }
    setUploading(true)
    setMessage('')

    const fileName = `${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('notes-pdfs')
      .upload(fileName, file)

    if (uploadError) {
      setMessage('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('notes-pdfs')
      .getPublicUrl(fileName)

    const pdfUrl = urlData.publicUrl

    const { error: insertError } = await supabase.from('notes').insert([
      {
        title,
        category,
        subject,
        class_or_exam: classOrExam,
        description,
        pages: pages ? parseInt(pages) : null,
        price: parseFloat(price),
        pdf_url: pdfUrl,
      },
    ])

    if (insertError) {
      setMessage('Failed to save note: ' + insertError.message)
    } else {
      setMessage('Note added successfully!')
      setTitle('')
      setSubject('')
      setClassOrExam('')
      setDescription('')
      setPages('')
      setPrice('')
      setFile(null)
      fetchNotes()
    }
    setUploading(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this note?')) return
    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (!error) fetchNotes()
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Admin Panel — Add a Note</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Title (e.g. SSC CGL Maths — Number System)" value={title}
          onChange={(e) => setTitle(e.target.value)} required />

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="school">School Notes</option>
          <option value="competitive">Competitive Notes</option>
        </select>

        <input placeholder="Subject (e.g. Mathematics)" value={subject}
          onChange={(e) => setSubject(e.target.value)} />

        <input placeholder="Class or Exam (e.g. Class 8 / SSC CGL)" value={classOrExam}
          onChange={(e) => setClassOrExam(e.target.value)} />

        <textarea placeholder="Short description" value={description}
          onChange={(e) => setDescription(e.target.value)} rows={3} />

        <input type="number" placeholder="Number of pages" value={pages}
          onChange={(e) => setPages(e.target.value)} />

        <input type="number" placeholder="Price (₹)" value={price}
          onChange={(e) => setPrice(e.target.value)} required />

        <label>
          PDF file:
          <input type="file" accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])} required />
        </label>

        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Add Note'}
        </button>

        {message && <p>{message}</p>}
      </form>

      <hr style={{ margin: '30px 0' }} />

      <h2>Existing Notes ({notes.length})</h2>
      {notes.map((note) => (
        <div key={note.id} style={{ border: '1px solid #ccc', padding: 10, marginBottom: 10, borderRadius: 6 }}>
          <strong>{note.title}</strong> — ₹{note.price}
          <br />
          <small>{note.category} · {note.subject} · {note.class_or_exam} · {note.pages} pages</small>
          <br />
          <a href={note.pdf_url} target="_blank" rel="noreferrer">View PDF</a>
          {' | '}
          <button onClick={() => handleDelete(note.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
          }
