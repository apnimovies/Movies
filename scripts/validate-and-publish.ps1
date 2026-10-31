$ErrorActionPreference = "Stop"

function Convert-ToSlug {
  param([string]$Text)

  $slug = $Text.Trim().ToLowerInvariant()
  $slug = [regex]::Replace($slug, "[^a-z0-9]+", "-")
  return $slug.Trim([char]"-")
}

function Stop-WithMessage {
  param([string]$Message)

  Write-Host ""
  Write-Host "ERROR: $Message" -ForegroundColor Red
  exit 1
}

try {
  $projectRoot = Split-Path -Parent $PSScriptRoot
  Set-Location $projectRoot

  if (-not (Test-Path -LiteralPath "movies.json")) {
    Stop-WithMessage "movies.json project root me nahi mili."
  }

  if (-not (Test-Path -LiteralPath "assets\posters")) {
    Stop-WithMessage "assets\posters folder nahi mila."
  }

  $movies = Get-Content -LiteralPath "movies.json" -Raw | ConvertFrom-Json
  if ($null -eq $movies) {
    Stop-WithMessage "movies.json empty hai."
  }

  $formatErrors = New-Object System.Collections.Generic.List[string]
  $posterWarnings = New-Object System.Collections.Generic.List[string]

  foreach ($movie in @($movies)) {
    $slug = Convert-ToSlug $movie.title
    $expectedId = $slug
    $expectedPoster = "assets/posters/$slug.jpg"
    $expectedFileName = "$slug.jpg"

    if ([string]$movie.id -cne $expectedId) {
      $formatErrors.Add("$($movie.title): id '$expectedId' hona chahiye.")
    }

    if (([string]$movie.poster).Replace("\", "/") -cne $expectedPoster) {
      $formatErrors.Add("$($movie.title): poster path '$expectedPoster' hona chahiye.")
    }

    $trackedPosterMatches = @(git ls-files -- "assets/posters/*" | Where-Object {
      $trackedBaseName = [System.IO.Path]::GetFileNameWithoutExtension($_)
      $trackedExtension = [System.IO.Path]::GetExtension($_)
      (Convert-ToSlug $trackedBaseName) -eq $slug -and $trackedExtension.ToLowerInvariant() -eq ".jpg"
    })

    if ($LASTEXITCODE -ne 0) {
      Stop-WithMessage "Git me tracked poster filenames check nahi ho sake."
    }

    if ($trackedPosterMatches.Count -gt 1) {
      $formatErrors.Add("$($movie.title): Git me same title ki multiple poster files tracked hain.")
      continue
    }

    $candidates = @(Get-ChildItem -LiteralPath "assets\posters" -File | Where-Object {
      (Convert-ToSlug $_.BaseName) -eq $slug -and $_.Extension.ToLowerInvariant() -eq ".jpg"
    })

    if ($candidates.Count -eq 0) {
      $formatErrors.Add("$($movie.title): '$expectedFileName' assets/posters folder me nahi mili.")
      continue
    }

    if ($candidates.Count -gt 1) {
      $formatErrors.Add("$($movie.title): same title ki multiple JPG poster files mili. Sirf '$expectedFileName' rakho.")
      continue
    }

    $posterFile = $candidates[0]
    if ($posterFile.Name -cne $expectedFileName) {
      $temporaryName = "__poster_rename_$([guid]::NewGuid().ToString('N')).jpg"
      Rename-Item -LiteralPath $posterFile.FullName -NewName $temporaryName
      Rename-Item -LiteralPath (Join-Path $posterFile.DirectoryName $temporaryName) -NewName $expectedFileName
      $posterFile = Get-Item -LiteralPath (Join-Path $posterFile.DirectoryName $expectedFileName)
      Write-Host "Renamed: $($movie.title) -> $expectedFileName" -ForegroundColor Cyan
    }

    if ($trackedPosterMatches.Count -eq 1 -and $trackedPosterMatches[0] -cne $expectedPoster) {
      git rm --cached -- $trackedPosterMatches[0]
      if ($LASTEXITCODE -ne 0) {
        Stop-WithMessage "$($movie.title) ka purana Git poster path remove nahi hua."
      }
      git add -- $expectedPoster
      if ($LASTEXITCODE -ne 0) {
        Stop-WithMessage "$($movie.title) ka correct Git poster path add nahi hua."
      }
      Write-Host "Git case fixed: $($trackedPosterMatches[0]) -> $expectedPoster" -ForegroundColor Cyan
    }

    try {
      Add-Type -AssemblyName System.Drawing
      $image = [System.Drawing.Image]::FromFile($posterFile.FullName)
      $width = $image.Width
      $height = $image.Height
      $image.Dispose()

      $ratio = $width / [double]$height
      if ($width -lt 600 -or $height -lt 900) {
        $posterWarnings.Add("$($movie.title): poster ${width}x${height}px hai; clear result ke liye 600x900px ya bada poster use karo.")
      }
      if ([math]::Abs($ratio - (2.0 / 3.0)) -gt 0.08) {
        $posterWarnings.Add("$($movie.title): poster portrait 2:3 ratio me nahi hai; recommended 600x900px hai.")
      }
    }
    catch {
      $formatErrors.Add("$($movie.title): poster valid JPG image nahi hai.")
    }
  }

  if ($formatErrors.Count -gt 0) {
    Write-Host ""
    Write-Host "Publish roka gaya. Pehle ye issues correct karo:" -ForegroundColor Red
    foreach ($issue in $formatErrors) {
      Write-Host "- $issue" -ForegroundColor Red
    }
    exit 1
  }

  if ($posterWarnings.Count -gt 0) {
    Write-Host ""
    Write-Host "Poster quality warnings:" -ForegroundColor Yellow
    foreach ($warning in $posterWarnings) {
      Write-Host "- $warning" -ForegroundColor Yellow
    }
  }


  # Detect only brand-new titles compared with the last published Git version.
  $newTitles = @()
  try {
    $oldJsonRaw = git show HEAD:movies.json 2>$null
    if ($LASTEXITCODE -eq 0 -and $oldJsonRaw) {
      $oldMovies = $oldJsonRaw | ConvertFrom-Json
      $oldIds = @{}
      foreach ($oldMovie in @($oldMovies)) {
        if ($oldMovie.id) { $oldIds[[string]$oldMovie.id] = $true }
      }

      foreach ($movie in @($movies)) {
        if ($movie.id -and -not $oldIds.ContainsKey([string]$movie.id)) {
          $newTitles += $movie
        }
      }
    }
  }
  catch {
    $newTitles = @()
  }

  git add -A
  if ($LASTEXITCODE -ne 0) {
    Stop-WithMessage "git add fail hua."
  }

  $stagedChanges = @(git diff --cached --name-only)
  if ($LASTEXITCODE -ne 0) {
    Stop-WithMessage "Git changes check nahi ho sakin."
  }

  if ($stagedChanges.Count -eq 0) {
    Write-Host ""
    Write-Host "Koi naya change publish karne ke liye nahi hai." -ForegroundColor Yellow
    exit 0
  }

  Write-Host ""
  Write-Host "Publishing these files:" -ForegroundColor Green
  $stagedChanges | ForEach-Object { Write-Host "- $_" }

  git commit -m "update movies and posters"
  if ($LASTEXITCODE -ne 0) {
    Stop-WithMessage "git commit fail hua."
  }

  git push origin main
  if ($LASTEXITCODE -ne 0) {
    Stop-WithMessage "git push fail hua."
  }


  # Send a push notification for each newly-added title after a successful publish.
  if ($newTitles.Count -gt 0) {
    $pushConfigPath = Join-Path $projectRoot "push-config.js"
    $oneSignalAppId = ""
    if (Test-Path -LiteralPath $pushConfigPath) {
      $pushConfigText = Get-Content -LiteralPath $pushConfigPath -Raw
      $appIdMatch = [regex]::Match($pushConfigText, 'appId\s*:\s*["'']([^"'']+)["'']')
      if ($appIdMatch.Success) {
        $oneSignalAppId = $appIdMatch.Groups[1].Value.Trim()
      }
    }

    $oneSignalApiKey = [Environment]::GetEnvironmentVariable("MOVIEHUB_ONESIGNAL_API_KEY", "User")
    if (-not $oneSignalApiKey) {
      $oneSignalApiKey = [Environment]::GetEnvironmentVariable("MOVIEHUB_ONESIGNAL_API_KEY", "Process")
    }

    if ($oneSignalAppId -and $oneSignalAppId -ne "PASTE_ONESIGNAL_APP_ID_HERE" -and $oneSignalApiKey) {
      foreach ($newTitle in $newTitles) {
        try {
          $itemType = if ($newTitle.type -eq "series") { "Web Series" } else { "Movie" }
          $payload = @{
            app_id = $oneSignalAppId
            target_channel = "push"
            included_segments = @("Total Subscriptions")
            headings = @{ en = "New $itemType Added" }
            contents = @{ en = "$($newTitle.title) is now available on MovieHub." }
            url = "movie.html?id=$([uri]::EscapeDataString([string]$newTitle.id))"
          } | ConvertTo-Json -Depth 6

          Invoke-RestMethod -Method Post `
            -Uri "https://api.onesignal.com/notifications" `
            -Headers @{ Authorization = "Key $oneSignalApiKey"; Accept = "application/json" } `
            -ContentType "application/json; charset=utf-8" `
            -Body $payload | Out-Null

          Write-Host "Push sent: $($newTitle.title)" -ForegroundColor Cyan
        }
        catch {
          Write-Host "WARNING: Website publish ho gaya, lekin '$($newTitle.title)' ka push send nahi hua: $($_.Exception.Message)" -ForegroundColor Yellow
        }
      }
    }
    else {
      Write-Host "WARNING: New title detect hua, lekin OneSignal setup incomplete hai; push skip kiya gaya." -ForegroundColor Yellow
      Write-Host "- push-config.js me App ID set karo" -ForegroundColor Yellow
      Write-Host "- Windows User environment variable MOVIEHUB_ONESIGNAL_API_KEY me API Key set karo" -ForegroundColor Yellow
    }
  }

  Write-Host ""
  Write-Host "SUCCESS: Website update GitHub par push ho gaya." -ForegroundColor Green
  Write-Host "GitHub Pages ko update hone me 1-3 minutes lag sakte hain." -ForegroundColor Green
}
catch {
  Stop-WithMessage $_.Exception.Message
}
