import { cardGrid } from './cardGrid'
import { contactForm } from './contactForm'
import { cta } from './cta'
import { disclaimer } from './disclaimer'
import { faq } from './faq'
import { featureGrid } from './featureGrid'
import { hero } from './hero'
import { imageText } from './imageText'
import { latestPosts } from './latestPosts'
import { priceTable } from './priceTable'
import { stats } from './stats'
import { steps } from './steps'
import { textBlock } from './textBlock'

export const sectionTypes = [
  hero,
  textBlock,
  imageText,
  featureGrid,
  stats,
  cardGrid,
  priceTable,
  faq,
  steps,
  latestPosts,
  cta,
  contactForm,
  disclaimer,
]

export const SECTION_TYPES = [...sectionTypes.map(({ name }) => name), 'quote']
