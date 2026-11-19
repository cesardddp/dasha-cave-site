import { readonly, shallowRef } from 'vue'

interface SwipeStart {
  pointerId: number
  x: number
  y: number
}

const SWIPE_THRESHOLD = 48

export function useCarousel(slideCount: number) {
  if (!Number.isInteger(slideCount) || slideCount < 1) {
    throw new RangeError('Carousel must contain at least one slide.')
  }

  const activeSlide = shallowRef(0)
  const swipeStart = shallowRef<SwipeStart | null>(null)

  function showPreviousSlide() {
    activeSlide.value = (activeSlide.value - 1 + slideCount) % slideCount
  }

  function showNextSlide() {
    activeSlide.value = (activeSlide.value + 1) % slideCount
  }

  function selectSlide(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= slideCount) {
      throw new RangeError('Selected slide is outside the carousel.')
    }

    activeSlide.value = index
  }

  function reset() {
    activeSlide.value = 0
    swipeStart.value = null
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      showPreviousSlide()
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      showNextSlide()
    }
  }

  function startSwipe(event: PointerEvent) {
    if (!event.isPrimary || event.pointerType === 'mouse') {
      return
    }

    swipeStart.value = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    }

    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
  }

  function finishSwipe(event: PointerEvent) {
    const start = swipeStart.value
    if (!start || event.pointerId !== start.pointerId) {
      return
    }

    swipeStart.value = null
    if (
      event.currentTarget instanceof HTMLElement
      && event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const deltaX = event.clientX - start.x
    const deltaY = event.clientY - start.y
    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return
    }

    if (deltaX < 0) {
      showNextSlide()
    } else {
      showPreviousSlide()
    }
  }

  function cancelSwipe() {
    swipeStart.value = null
  }

  return {
    activeSlide: readonly(activeSlide),
    cancelSwipe,
    finishSwipe,
    handleKeydown,
    reset,
    selectSlide,
    showNextSlide,
    showPreviousSlide,
    startSwipe,
  }
}
