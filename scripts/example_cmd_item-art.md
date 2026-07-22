# Commandes

## 

```
node scripts/extract-item-diff.mjs --base "item-art/raw/robot-unit01/base.jpg" --variant "item-art/raw/robot-unit01/mouffle-rose.jpg" --name mouffle-rose
# (retouche manuelle simulée sur mouffle-rose_diff_asset_4.png)
node scripts/compose-item-layer.mjs --regions item-art/extracted/mouffle-rose/mouffle-rose_regions.json --keep 1,4
```

###  Extraction de l'asset via script de diff, puis agrégation pour créer le layer

```
node scripts/extract-item-diff.mjs --base "item-art/raw/robot-unit01/base.jpg" --variant "item-art/raw/robot-unit01/casque-aile.jpg" --name casque-aile                                                                
node scripts/compose-item-layer.mjs --regions item-art/extracted/casque-aile/casque-aile_regions.json --keep 1,2                                                                                                       
```

### Ajout des items en base

```                                                                                                                                                                                       
node scripts/add-shop-item.mjs \                                                                                                                                                                                       
    --code hat_helmet_common \                                                                                                                                                                                           
    --slot hat \                                                                                                                                                                                                         
    --image item-art/extracted/casque-aile/casque-aile_layer.png \                                                                                                                                                       
    --price 150 \                                                                                                                                                                                                        
    --rarity common \                                                                                                                                                                                                    
    --unlock-level 9 \                                                                                                                                                                                                   
    --name-fr "Casque ailé" --name-en "Winged helmet" --name-es "Casco alado" --name-zh "带翼头盔"                                                                                                                       
```
→ copie du PNG dans static/images/items/, insertion en base (id=1, sort_order=1).                                                                                                                                      
                                                                                                                                                                                                                         
```                                                                                                                                                                                             
node scripts/add-shop-item.mjs \                                                                                                                                                                                       
    --code body_robot_unit01 \                                                                                                                                                                                           
    --slot body \                                                                                                                                                                                                        
    --image item-art/extracted/casque-aile/casque-aile_base_extracted.png \                                                                                                                                              
    --price 150 \                                                                                                                                                                                                        
    --rarity common \                                                                                                                                                                                                    
    --unlock-level 1 \                                                                                                                                                                                                   
    --name-fr "Robot Unit-01" --name-en "Robot Unit-01" --name-es "Robot Unidad-01" --name-zh "机器人01号"      
```
→ copie + insertion (id=3, sort_order=2, l'id=2 ayant été "brûlé" par la tentative en doublon du point 3, comportement normal d'une séquence Postgres).