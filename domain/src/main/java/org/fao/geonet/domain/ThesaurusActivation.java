package org.fao.geonet.domain;

import org.fao.geonet.entitylistener.ThesaurusActivationEntityListenerManager;

import javax.persistence.*;

/**
 * Entity indicating which thesauri are enabled.
 *
 * @author Jesse
 */
@Entity
@Access(AccessType.PROPERTY)
@Table(name = "Thesaurus")
@EntityListeners(ThesaurusActivationEntityListenerManager.class)
public class ThesaurusActivation {
    private String _id;
    private char _activated = Constants.YN_TRUE;

    /**
     * Get the id of the ThesaurusActivation.  This is not autogenerated and is the FName of the thesaurus the activation
     * applies to.
     *
     * @return the id of the ThesaurusActivation
     */
    @Id
    public String getId() {
        return _id;
    }

    /**
     * Set the id of the ThesaurusActivation.  This is not autogenerated and is the FName of the thesaurus the activation
     * applies to.
     *
     * @param id the id of the ThesaurusActivation.  The FName of the thesaurus
     */
    public void setId(String id) {
        this._id = id;
    }

    /**
     * For backwards compatibility we need the activated column to be either 'n' or 'y'. This is a workaround to allow this until future
     * versions of JPA that allow different ways of controlling how types are mapped to the database.
     */
    @Column(name = "activated", nullable = false, length = 1)
    protected char getActivated_JpaWorkaround() {
        return _activated;
    }

    /**
     * Set the column value. Constants.YN_ENABLED for true Constants.YN_DISABLED for false.
     *
     * @param activated the column value. Constants.YN_ENABLED for true Constants.YN_DISABLED for false.
     * @return
     */
    protected void setActivated_JpaWorkaround(char activated) {
        _activated = activated;
    }

    /**
     * Return true if the thesaurus is active.
     *
     * @return true if the thesaurus is active.
     */
    @Transient
    public boolean isActivated() {
        return Constants.toBoolean_fromYNChar(getActivated_JpaWorkaround());
    }

    /**
     * Set true if the thesaurus is active.
     *
     * @param activated true if the thesaurus is active.
     */
    public void setActivated(boolean activated) {
        setActivated_JpaWorkaround(Constants.toYN_EnabledChar(activated));
    }


    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        ThesaurusActivation that = (ThesaurusActivation) o;

        if (_activated != that._activated) return false;
        if (_id != null ? !_id.equals(that._id) : that._id != null) return false;

        return true;
    }

    @Override
    public int hashCode() {
        int result = _id != null ? _id.hashCode() : 0;
        result = 31 * result + (int) _activated;
        return result;
    }
}
