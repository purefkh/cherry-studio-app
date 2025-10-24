import { usePreference } from './usePreference'

export function useSettings() {
  const [avatar, setAvatar] = usePreference('user.avatar')
  const [userName, setUserName] = usePreference('user.name')
  const [userId] = usePreference('user.id')
  const [theme, setTheme] = usePreference('ui.theme_mode')

  return {
    avatar,
    userName,
    userId,
    theme,
    setAvatar,
    setUserName,
    setTheme
  }
}
