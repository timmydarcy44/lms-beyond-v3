# Script de test pour vérifier qu'un utilisateur a bien accès à une ressource après un achat
# Usage: .\scripts\test-access-after-purchase.ps1 -Email "user@example.com" -CatalogItemId "xxx-xxx-xxx"

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$CatalogItemId,
    
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test d'accès après achat" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Paramètres:" -ForegroundColor Yellow
Write-Host "  Email: $Email"
Write-Host "  Catalog Item ID: $CatalogItemId"
Write-Host "  Base URL: $BaseUrl"
Write-Host ""

# Construire l'URL de test
$testUrl = "$BaseUrl/api/test/verify-access?email=$([System.Web.HttpUtility]::UrlEncode($Email))&catalogItemId=$CatalogItemId"

Write-Host "Appel de l'API de test..." -ForegroundColor Yellow
Write-Host "URL: $testUrl"
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $testUrl -Method GET -ContentType "application/json"
    
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "RÉSULTAT DU TEST" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    # Afficher les informations utilisateur
    Write-Host "Utilisateur:" -ForegroundColor Cyan
    Write-Host "  ID: $($response.user.id)"
    Write-Host "  Email: $($response.user.email)"
    Write-Host ""
    
    # Afficher les informations du catalog item
    Write-Host "Ressource:" -ForegroundColor Cyan
    Write-Host "  ID: $($response.catalogItem.id)"
    Write-Host "  Titre: $($response.catalogItem.title)"
    Write-Host "  Type: $($response.catalogItem.item_type)"
    Write-Host "  Prix: $($response.catalogItem.price)€"
    Write-Host "  Gratuit: $($response.catalogItem.is_free)"
    Write-Host ""
    
    # Afficher les informations d'accès
    if ($response.access) {
        Write-Host "Accès trouvé:" -ForegroundColor Green
        Write-Host "  ID: $($response.access.id)"
        Write-Host "  Statut: $($response.access.access_status)"
        Write-Host "  Accordé le: $($response.access.granted_at)"
        if ($response.access.purchase_amount) {
            Write-Host "  Montant: $($response.access.purchase_amount)€"
        }
        if ($response.access.purchase_date) {
            Write-Host "  Date d'achat: $($response.access.purchase_date)"
        }
        if ($response.access.transaction_id) {
            Write-Host "  Transaction ID: $($response.access.transaction_id)"
        }
    } else {
        Write-Host "Aucun accès trouvé dans catalog_access" -ForegroundColor Yellow
    }
    Write-Host ""
    
    # Afficher le résultat final
    Write-Host "Vérification d'accès:" -ForegroundColor Cyan
    Write-Host "  A accès: $($response.accessCheck.hasAccess)" -ForegroundColor $(if ($response.accessCheck.hasAccess) { "Green" } else { "Red" })
    Write-Host "  Est gratuit: $($response.accessCheck.isFree)"
    Write-Host "  Est créateur: $($response.accessCheck.isCreator)"
    Write-Host "  A un accès explicite: $($response.accessCheck.hasExplicitAccess)"
    Write-Host "  Raison: $($response.accessCheck.reason)"
    Write-Host ""
    
    # Afficher la recommandation
    Write-Host "Recommandation:" -ForegroundColor $(if ($response.accessCheck.hasAccess) { "Green" } else { "Yellow" })
    Write-Host "  $($response.recommendation)"
    Write-Host ""
    
    # Résultat final
    if ($response.accessCheck.hasAccess) {
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✅ TEST RÉUSSI - L'utilisateur a accès" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "❌ TEST ÉCHOUÉ - L'utilisateur n'a pas accès" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "ERREUR LORS DU TEST" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Message d'erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Réponse du serveur:" -ForegroundColor Yellow
        Write-Host $responseBody
    }
    
    exit 1
}

