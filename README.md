# NextGen Notes

## Kaise deploy karein (Vercel)

1. GitHub par ek naya repository banao, naam do: `nextgen-notes`
2. Is poore folder ke saare files/folders upload kar do (drag & drop se GitHub website par ho jayega)
3. vercel.com par jao → "Sign up with GitHub"
4. "New Project" → apna `nextgen-notes` repo select karo
5. Framework Preset apne aap "Vite" detect ho jayega — bas "Deploy" dabao
6. 1-2 minute mein live link mil jayega, jaise: `nextgen-notes.vercel.app`

## Naya note add karna (baad mein)

`src/App.jsx` file kholo, `PRODUCTS` list mein niche jaisa ek naya object add karo:

```js
{
  id: "unique-id-yahan",
  section: "School" ya "Competitive",
  subject: "Subject ka naam",
  title: "Note ka title",
  desc: "Chhoti si description",
  pages: 10,
  price: 29,
  grade: "Class ya exam ka naam",
}
```

Save karke GitHub par push kardo — Vercel apne aap naya version deploy kar dega.
